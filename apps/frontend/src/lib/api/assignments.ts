import axios from 'axios';

/**
 * Frontend calls `${origin}/api/...`.
 * Normalize `NEXT_PUBLIC_API_URL`: trim slashes and strip a mistaken trailing `/api`
 * so we never hit `/api/api/assignments`.
 */
export function normalizeBackendOrigin(raw?: string): string {
  let s = (raw ?? '').trim().replace(/\/+$/, '');
  if (/\/api$/i.test(s)) {
    s = s.replace(/\/api$/i, '').replace(/\/+$/, '');
  }
  return s || 'http://localhost:4000';
}

/** Hostname/port the browser should call (shown in connectivity errors). */
export const API_BACKEND_ORIGIN = normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: `${API_BACKEND_ORIGIN}/api`,
  timeout: 30000,
});

export interface CreateAssignmentResponse {
  assignmentId: string;
  jobId: string;
  status: string;
}

export interface AssignmentListResponse {
  assignments: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function createAssignment(formData: FormData): Promise<CreateAssignmentResponse> {
  const { data } = await api.post<CreateAssignmentResponse>('/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getAssignment(id: string): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/assignments/${id}`);
  return data;
}

export async function listAssignments(
  page: number = 1,
  status?: string,
  signal?: AbortSignal
): Promise<AssignmentListResponse> {
  const params: Record<string, string | number> = { page };
  if (status) params.status = status;
  const { data } = await api.get<AssignmentListResponse>('/assignments', {
    params,
    signal,
  });
  return data;
}

export async function regenerateAssignment(
  id: string
): Promise<{ jobId: string; status: string }> {
  const { data } = await api.post(`/assignments/${id}/regenerate`);
  return data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await api.delete(`/assignments/${id}`);
}
