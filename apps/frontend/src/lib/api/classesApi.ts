import { apiClient } from '@/lib/api/http';

export interface TeacherClassListItem {
  id: string;
  name: string;
  subject?: string | null;
  description?: string | null;
  joinCode: string;
  inviteCount: number;
  linkedAccountCount: number;
  updatedAt: string | null;
  createdAt: string | null;
}

export interface TeacherClassDetail extends TeacherClassListItem {
  studentEmails: string[];
  studentIds: string[];
}

export async function fetchTeacherClasses(): Promise<TeacherClassListItem[]> {
  const { data } = await apiClient.get<TeacherClassListItem[]>('/classes');
  return data;
}

export async function fetchTeacherClass(id: string): Promise<TeacherClassDetail> {
  const { data } = await apiClient.get<TeacherClassDetail>(`/classes/${id}`);
  return data;
}

export async function createTeacherClass(body: {
  name: string;
  subject?: string;
  description?: string;
}): Promise<TeacherClassListItem> {
  const { data } = await apiClient.post<TeacherClassListItem>('/classes', body);
  return data;
}

export async function updateTeacherClass(
  id: string,
  body: Partial<{
    name: string;
    subject: string | null;
    description: string | null;
    studentEmails: string[];
  }>
): Promise<TeacherClassDetail> {
  const { data } = await apiClient.patch<TeacherClassDetail>(`/classes/${id}`, body);
  return data;
}

export async function deleteTeacherClass(id: string): Promise<void> {
  await apiClient.delete(`/classes/${id}`);
}

export async function joinClassByCode(code: string): Promise<{
  ok: boolean;
  className: string;
  joinCode: string;
}> {
  const { data } = await apiClient.post(`/classes/join`, {
    code: code.trim().toUpperCase(),
  });
  return data;
}
