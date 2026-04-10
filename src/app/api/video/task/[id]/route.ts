import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/config/db';
import { videoTask, user } from '@/config/db/schema.postgres';
import { eq, and, sql } from 'drizzle-orm';
import { rhQueryTask, rhDownloadResult } from '@/shared/lib/runninghub';
import { uploadToR2, getPresignedUrl } from '@/shared/lib/r2';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: taskId } = await params;

  const task = await db.query.videoTask.findFirst({
    where: and(eq(videoTask.id, taskId), eq(videoTask.userId, userId)),
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: task.id,
    status: task.status,
    resolution: task.resolution,
    duration: task.duration,
    resultUrl: task.resultKey ? await getPresignedUrl(task.resultKey, 3600) : null,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt?.toISOString() || null,
  });
}

// Poll RunningHub and update task status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: taskId } = await params;

  const task = await db.query.videoTask.findFirst({
    where: and(eq(videoTask.id, taskId), eq(videoTask.userId, userId)),
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!task.rhTaskId) {
    return NextResponse.json({ error: 'No RunningHub task ID' }, { status: 400 });
  }

  // Already completed
  if (task.status === 'success' || task.status === 'failed') {
    return NextResponse.json({
      id: task.id,
      status: task.status,
      resultUrl: task.resultKey ? await getPresignedUrl(task.resultKey, 3600) : null,
      errorMessage: task.errorMessage,
    });
  }

  try {
    const result = await rhQueryTask(task.rhTaskId);

    if (result.status === 'SUCCESS' && result.results?.[0]?.url) {
      // Download result and store in R2
      const videoBuffer = await rhDownloadResult(result.results[0].url);
      const resultKey = `tasks/${taskId}/result.mp4`;
      await uploadToR2(resultKey, videoBuffer, 'video/mp4');

      const updatedTask = await db.update(videoTask)
        .set({
          status: 'success',
          resultKey,
          rhCoinsCost: result.usage?.consumeCoins ? parseInt(result.usage.consumeCoins) : null,
          completedAt: new Date(),
        })
        .where(and(eq(videoTask.id, taskId), eq(videoTask.status, task.status)))
        .returning({ id: videoTask.id });

      if (updatedTask.length === 0) {
        const latestTask = await db.query.videoTask.findFirst({
          where: and(eq(videoTask.id, taskId), eq(videoTask.userId, userId)),
        });

        return NextResponse.json({
          id: taskId,
          status: latestTask?.status ?? 'running',
          resultUrl: latestTask?.resultKey ? await getPresignedUrl(latestTask.resultKey, 3600) : null,
          errorMessage: latestTask?.errorMessage ?? null,
        });
      }

      return NextResponse.json({
        id: taskId,
        status: 'success',
        resultUrl: await getPresignedUrl(resultKey, 3600),
      });
    }

    if (result.status === 'FAILED') {
      const failedTask = await db.update(videoTask)
        .set({
          status: 'failed',
          errorMessage: result.errorMessage || 'Generation failed',
          completedAt: new Date(),
        })
        .where(and(eq(videoTask.id, taskId), eq(videoTask.status, task.status)))
        .returning({ id: videoTask.id });

      // Refund credit on failure
      if (failedTask.length > 0) {
        await db.update(user)
          .set({ credits: sql`${user.credits} + 1` })
          .where(eq(user.id, userId));
      }

      return NextResponse.json({
        id: taskId,
        status: 'failed',
        errorMessage: result.errorMessage || 'Generation failed',
      });
    }

    return NextResponse.json({
      id: taskId,
      status: 'running',
      rhStatus: result.status,
    });
  } catch (error: unknown) {
    console.error('Task query failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
