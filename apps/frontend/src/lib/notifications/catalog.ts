export type NotificationAudience = 'teacher' | 'student';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  /** In-app destination when the row is tapped */
  href?: string;
  /** Highlighted styling + sorted first */
  important?: boolean;
  /** Omit = shown to everyone; otherwise only listed roles */
  roles?: NotificationAudience[];
}

/** Curated notices until a backend feed exists — keep actionable and concise. */
export const NOTIFICATION_CATALOG: AppNotification[] = [
  {
    id: 'teacher-queue-status',
    title: 'Check processing assignments',
    body: 'Pending or processing papers finish in the background. Reload the assignments list after a minute if nothing changes.',
    href: '/assignments',
    important: true,
    roles: ['teacher'],
  },
  {
    id: 'teacher-analytics',
    title: 'Reliability insights',
    body: 'Use Analytics for generation counts, failure rates, and weekly cadence for papers you authored.',
    href: '/analytics',
    roles: ['teacher'],
  },
  {
    id: 'teacher-publish',
    title: 'Share papers with learners',
    body: 'Add student emails or Clerk IDs when creating an assignment so it appears on their dashboards.',
    href: '/assignments/new',
    roles: ['teacher'],
  },
  {
    id: 'student-assignments-hub',
    title: 'Your shared papers live here',
    body: 'Open My assignments to generate content, track status, or view results once a paper is ready.',
    href: '/student/assignments',
    important: true,
    roles: ['student'],
  },
  {
    id: 'student-join',
    title: "Can't see class work?",
    body: 'Use Join class if an instructor gave you a code—then new shared papers appear automatically.',
    href: '/student/join',
    roles: ['student'],
  },
  {
    id: 'student-analytics-overview',
    title: 'Workload and due dates',
    body: 'Student Analytics summarizes shared papers, due dates, and question volume—not graded scores.',
    href: '/student/analytics',
    roles: ['student'],
  },
];

export function notificationsForAudience(role: NotificationAudience): AppNotification[] {
  const list = NOTIFICATION_CATALOG.filter((n) => !n.roles || n.roles.includes(role));
  return [...list].sort((a, b) => Number(!!b.important) - Number(!!a.important));
}
