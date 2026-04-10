import { NextResponse } from 'next/server';
import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import { user, videoTask } from '@/config/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getRemainingCredits } from '@/shared/models/credit';

export async function GET() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await (async () => {
      const { headers } = await import('next/headers');
      return headers();
    })(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const userRecord = await db().query.user.findFirst({
    where: sql`${user.id} = ${userId}`,
  });

  if (!userRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userTasks = await db().query.videoTask.findMany({
    where: eq(videoTask.userId, userId),
    orderBy: [desc(videoTask.createdAt)],
  });

  const remainingCredits = await getRemainingCredits(userId);

  return NextResponse.json({
    id: userRecord.id,
    email: userRecord.email || 'No email',
    credits: remainingCredits,
    plan: 'free',
    tasks: userTasks.map(task => ({
      id: task.id,
      status: task.status || 'queued',
      resolution: task.resolution ?? 540,
      duration: task.duration ?? 14,
      createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
      completedAt: task.completedAt?.toISOString() || null,
    })),
  });
}
