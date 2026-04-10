import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { videoTask } from '@/config/db/schema';
import { rhSubmitTask, rhUpload } from '@/shared/lib/runninghub';
import { getPresignedUrl } from '@/shared/lib/r2';
import { consumeCredits } from '@/shared/models/credit';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  let creditRecord: any = null;

  try {
    const body = await req.json();
    const { photoKey, videoKey, resolution: resStr, duration: durationStr } = body;

    if (!photoKey || !videoKey) {
      return NextResponse.json({ error: 'photoKey and videoKey are required' }, { status: 400 });
    }

    const resolution = parseInt(resStr, 10) || 540;
    const duration = parseInt(String(durationStr), 10) || 14;

    if (duration < 1 || duration > 30) {
      return NextResponse.json({ error: 'Duration must be between 1 and 30 seconds' }, { status: 400 });
    }

    const taskId = uuid();

    // Consume 1 credit using ShipAny credit system
    try {
      creditRecord = await consumeCredits({
        userId,
        credits: 1,
        scene: 'video_generation',
        description: `Video generation task ${taskId}`,
        metadata: JSON.stringify({
          taskId,
          resolution,
          duration,
          photoKey,
          videoKey
        }),
      });
    } catch (error) {
      // Insufficient credits or other credit system error
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Insufficient credits. Please purchase credits first.' },
        { status: 402 }
      );
    }

    const [photoUrl, videoUrl] = await Promise.all([
      getPresignedUrl(photoKey, 600),
      getPresignedUrl(videoKey, 600),
    ]);

    // Download files from R2 to upload to RunningHub
    const [photoRes, videoRes] = await Promise.all([
      fetch(photoUrl),
      fetch(videoUrl),
    ]);

    if (!photoRes.ok || !videoRes.ok) {
      return NextResponse.json({ error: 'Failed to retrieve uploaded files' }, { status: 400 });
    }

    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const photoExt = photoKey.split('.').pop() || 'png';
    const videoExt = videoKey.split('.').pop() || 'mp4';

    // Upload to RunningHub
    const [rhImage, rhVideo] = await Promise.all([
      rhUpload(photoBuffer, `${taskId}.${photoExt}`),
      rhUpload(videoBuffer, `${taskId}.${videoExt}`),
    ]);

    // Submit task to RunningHub
    const rhResult = await rhSubmitTask({
      imageFile: rhImage.fileName,
      videoFile: rhVideo.fileName,
      resolution,
      fps: 30,
      duration,
    });

    await db().insert(videoTask).values({
      id: taskId,
      userId: userId,
      status: 'running',
      imageKey: photoKey,
      videoKey: videoKey,
      rhTaskId: rhResult.taskId,
      rhImageFile: rhImage.fileName,
      rhVideoFile: rhVideo.fileName,
      resolution,
      duration,
      fps: 30,
      creditId: creditRecord.id, // Link to credit transaction
    });

    return NextResponse.json({
      taskId,
      rhTaskId: rhResult.taskId,
      status: rhResult.status,
    });
  } catch (error: unknown) {
    console.error('Task creation failed:', error);

    // Note: Credit refund on error is handled by the task status route
    // when the task is marked as failed. This prevents double-refunds.

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
