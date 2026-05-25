import { apiClient } from '@/lib/api/http';

export interface AttentionItem {
  id: string;
  title: string;
  subject: string;
  status: string;
  kind: 'failed' | 'stuck';
  updatedAt: string;
  detail?: string;
}

export interface AnalyticsSummary {
  totalAssignments: number;
  backlog: number;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  /** Failed ÷ (completed + failed)—useful when debugging generation quality */
  failureRatePct: number;
  /** Completed ÷ (completed + failed)—share of authored papers that reached a final */
  pipelineSuccessPct: number;
  weekly: Array<{ year: number; week: number; count: number }>;
  bySubject: Array<{ subject: string; count: number }>;
  trends: {
    createdThisWeek: number;
    createdPriorWeek: number;
    finishedThisWeek: number;
    finishedPriorWeek: number;
  };
  attentionItems: AttentionItem[];
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return data;
}

/** Student dashboard: scoped to assessments shared with this learner only. */
export interface StudentAnalyticsSummary {
  totalShared: number;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  workload: {
    totalQuestions: number;
    totalMarks: number;
  };
  bySubject: Array<{ subject: string; count: number }>;
  uniqueTeachers: number;
  overdueCount: number;
  dueSoonCount: number;
  upcomingDue: Array<{
    _id: string;
    title: string;
    subject: string;
    status: string;
    dueDateRaw: string;
    dueAt: string | null;
    daysUntil: number | null;
    hrefPath: string;
  }>;
  weekly: Array<{ weekStart: string; count: number }>;
}

export async function fetchStudentAnalyticsSummary(): Promise<StudentAnalyticsSummary> {
  const { data } = await apiClient.get<StudentAnalyticsSummary>('/analytics/student/summary');
  return data;
}
