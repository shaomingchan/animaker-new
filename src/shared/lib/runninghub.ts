const API_BASE = 'https://www.runninghub.cn';
const API_KEY = process.env.RUNNINGHUB_API_KEY!;
const WEBAPP_ID = process.env.RUNNINGHUB_WEBAPP_ID || '1982768582520119298';

interface RHUploadResult {
  type: string;
  download_url: string;
  fileName: string;
  size: string;
}

interface RHUploadResponse {
  code: number;
  msg: string;
  data: RHUploadResult;
}

interface RHSubmitResponse {
  taskId: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
}

interface RHTaskResult {
  taskId: string;
  status: string;
  errorCode: string;
  errorMessage: string;
  results: Array<{ url: string; outputType: string; text: string | null }> | null;
  usage: {
    consumeCoins: string | null;
    taskCostTime: string | null;
  } | null;
}

// Upload file to RunningHub
export async function rhUpload(fileBuffer: Buffer, filename: string): Promise<RHUploadResult> {
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(fileBuffer)]), filename);

  const res = await fetch(`${API_BASE}/openapi/v2/media/upload/binary`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    body: formData,
  });

  const data = (await res.json()) as RHUploadResponse;
  if (data.code !== 0) throw new Error(`RH upload failed: ${data.msg}`);
  return data.data;
}

// Submit task to RunningHub
export async function rhSubmitTask(params: {
  imageFile: string;
  videoFile: string;
  resolution?: number;
  fps?: number;
  duration?: number;
}): Promise<{ taskId: string; status: string }> {
  const { imageFile, videoFile, resolution = 540, fps = 30, duration = 5 } = params;

  const res = await fetch(`${API_BASE}/openapi/v2/run/ai-app/${WEBAPP_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      nodeInfoList: [
        { nodeId: '56', fieldName: 'video', fieldValue: videoFile, description: '动作参考' },
        { nodeId: '57', fieldName: 'image', fieldValue: imageFile, description: '加载图片' },
        { nodeId: '55', fieldName: 'value', fieldValue: String(resolution), description: '设置分辨率' },
        { nodeId: '50', fieldName: 'value', fieldValue: String(fps), description: '设置帧率' },
        { nodeId: '49', fieldName: 'value', fieldValue: String(duration), description: '设置时长' },
      ],
      instanceType: 'plus',
      usePersonalQueue: 'false',
    }),
  });

  const data = (await res.json()) as RHSubmitResponse;
  if (data.errorCode) throw new Error(`RH submit failed: ${data.errorMessage}`);
  return { taskId: data.taskId, status: data.status };
}

// Query task status
export async function rhQueryTask(taskId: string): Promise<RHTaskResult> {
  const res = await fetch(`${API_BASE}/openapi/v2/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ taskId }),
  });

  return (await res.json()) as RHTaskResult;
}

// Download result file
export async function rhDownloadResult(url: string): Promise<Buffer> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
