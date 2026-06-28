import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface YoutubeUploadResult {
  videoId: string;
  url: string;
  embedUrl: string;
  title: string;
  privacyStatus: string;
}

export async function uploadVideoToYoutube(
  file: File,
  metadata: { title?: string; description?: string; courseId?: string; lessonTitle?: string },
  onProgress?: (pct: number) => void
): Promise<YoutubeUploadResult> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('You must be logged in to upload videos');

  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('video', file);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.courseId) formData.append('courseId', metadata.courseId);
  if (metadata.lessonTitle) formData.append('lessonTitle', metadata.lessonTitle);

  const response = await axios.post<YoutubeUploadResult>(
    `${API_BASE}/api/youtube/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );

  return response.data;
}
