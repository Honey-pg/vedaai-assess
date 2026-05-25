import { apiClient, API_BACKEND_ORIGIN, normalizeBackendOrigin } from '@/lib/api/http';

/** Re-export for assignment pages that show hostname in errors */
export { API_BACKEND_ORIGIN, normalizeBackendOrigin };

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
  const { data } = await apiClient.post<CreateAssignmentResponse>('/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getAssignment(id: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get(`/assignments/${id}`);
  return data;
}

export async function listAssignments(
  page: number = 1,
  status?: string,
  signal?: AbortSignal
): Promise<AssignmentListResponse> {
  const params: Record<string, string | number> = { page };
  if (status) params.status = status;
  const { data } = await apiClient.get<AssignmentListResponse>('/assignments', {
    params,
    signal,
  });
  return data;
}

export async function regenerateAssignment(
  id: string
): Promise<{ jobId: string; status: string }> {
  const { data } = await apiClient.post(`/assignments/${id}/regenerate`);
  return data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete(`/assignments/${id}`);
}
