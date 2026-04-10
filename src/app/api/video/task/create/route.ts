import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/config/db';
import { user, videoTask } from '@/config/db/schema.postgres';
import { sql, eq } from 'drizzle-orm';
import { rhSubmitTask, rhUpload } from '@/shared/lib/runninghub';
import { getPresignedUrl } from '@/shared/lib/r2';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  let creditDeducted = false;

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

    // Deduct 1 credit from user
    const creditDeductResult = await db.update(user)
      .set({ credits: sql`${user.credits} - 1` })
      .where(sql`${user.id} = ${userId} AND ${user.credits} > 0`)
      .returning({ id: user.id });

    if (!creditDeductResult || creditDeductResult.length === 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Please purchase credits first.' },
        { status: 402 }
      );
    }
    creditDeducted = true;

    const taskId = uuid();

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

    await db.insert(videoTask).values({
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
    });

    creditDeducted = false;
    return NextResponse.json({
      taskId,
      rhTaskId: rhResult.taskId,
      status: rhResult.status,
    });
  } catch (error: unknown) {
    // Rollback credit deduction on error
    if (creditDeducted) {
      await db.update(user)
        .set({ credits: sql`${user.credits} + 1` })
        .where(eq(user.id, userId));
    }
    console.error('Task creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
