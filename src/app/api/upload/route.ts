import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/core/auth';
import { getUploadPresignedUrl } from '@/shared/lib/r2';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName, contentType, fileType } = await req.json();
    // fileType = "photo" | "video"

    if (!fileName || !contentType || !fileType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (fileType !== 'photo' && fileType !== 'video') {
      return NextResponse.json({ error: 'fileType must be photo or video' }, { status: 400 });
    }

    const ext = fileName.split('.').pop() || (fileType === 'photo' ? 'png' : 'mp4');
    const taskId = uuid();
    const key = `tasks/${taskId}/${fileType === 'photo' ? 'input' : 'reference'}.${ext}`;

    const presignedUrl = await getUploadPresignedUrl(key, contentType, 600);

    return NextResponse.json({
      presignedUrl,
      key,
      taskId,
    });
  } catch (error: unknown) {
    console.error('Presigned URL generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
