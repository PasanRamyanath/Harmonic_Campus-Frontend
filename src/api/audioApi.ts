const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export type Engine = 'demucs' | 'spleeter';

export interface SeparationResult {
  status?: string;
  success?: boolean;
  job_id: string;
  stems: number;
  model: string;
  engine: string;
  files: Record<string, string>;
}

export interface ServiceHealth {
  nodeBackend: string;
  demucs: { status: string; service?: string; error?: string };
  spleeter: { status: string; service?: string; error?: string };
}

export async function separateAudio(
  file: File,
  engine: Engine,
  stems: number
): Promise<SeparationResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('engine', engine);
  formData.append('stems', stems.toString());

  const response = await fetch(`${API_BASE}/api/audio/separate`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Audio separation failed');
  }
  return data;
}

export async function checkAudioHealth(): Promise<ServiceHealth> {
  const response = await fetch(`${API_BASE}/api/audio/health`);
  return response.json();
}

export async function cleanupJob(engine: Engine, jobId: string): Promise<void> {
  await fetch(`${API_BASE}/api/audio/cleanup/${engine}/${jobId}`, {
    method: 'DELETE',
  });
}
