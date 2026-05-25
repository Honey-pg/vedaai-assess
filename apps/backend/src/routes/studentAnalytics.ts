import { Router, type Request, type Response } from 'express';
import { AssignmentModel } from '../models/Assignment';
import { buildStudentAssignmentFilter, normalizeUserEmail } from '../utils/studentAssignmentScope';

const router = Router();

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** MongoDB $dateTrunc('week','UTC') aligns to UTC Monday; mirrors client bucketing keys. */
function utcMondayContaining(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = x.getUTCDay();
  const off = dow === 0 ? -6 : 1 - dow;
  x.setUTCDate(x.getUTCDate() + off);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDaysUtc(base: Date, days: number): Date {
  const out = new Date(base);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function buildWeeklyBucketSeries(
  since: Date,
  counts: Map<string, number>
): { weekStart: string; count: number }[] {
  let weekStart = utcMondayContaining(since);
  const lastWeekStart = utcMondayContaining(new Date());
  const buckets: { weekStart: string; count: number }[] = [];

  while (weekStart <= lastWeekStart) {
    const key = weekStart.toISOString().slice(0, 10);
    buckets.push({
      weekStart: key,
      count: counts.get(key) ?? 0,
    });
    weekStart = addDaysUtc(weekStart, 7);
    if (buckets.length > 10) break;
  }

  return buckets.length > 0
    ? buckets
    : [
        {
          weekStart: lastWeekStart.toISOString().slice(0, 10),
          count: 0,
        },
      ];
}

/** Parse ISO date prefix (YYYY-MM-DD) or Date.parse fallback. */
function parseDueDateString(raw: unknown): Date | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const s = raw.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const day = Number(m[3]);
    const dt = new Date(y, mo, day);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t);
}

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.vedaUser!;
    const clerkId = user.clerkUserId;
    const emailNorm = normalizeUserEmail(user);
    const match = buildStudentAssignmentFilter(clerkId, emailNorm);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalShared,
      pending,
      processing,
      completed,
      failed,
      workloadAgg,
      subjectAgg,
      teacherAgg,
      weeklyByTrunc,
      dueRows,
    ] = await Promise.all([
      AssignmentModel.countDocuments(match),
      AssignmentModel.countDocuments({ ...match, status: 'pending' }),
      AssignmentModel.countDocuments({ ...match, status: 'processing' }),
      AssignmentModel.countDocuments({ ...match, status: 'completed' }),
      AssignmentModel.countDocuments({ ...match, status: 'failed' }),
      AssignmentModel.aggregate<{ totalQuestions?: number; totalMarks?: number }>([
        { $match: match },
        { $unwind: '$input.questionConfigs' },
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: '$input.questionConfigs.count' },
            totalMarks: {
              $sum: {
                $multiply: ['$input.questionConfigs.count', '$input.questionConfigs.marksPerQuestion'],
              },
            },
          },
        },
      ]),
      AssignmentModel.aggregate<{ _id: string; count: number }>([
        { $match: match },
        { $group: { _id: '$input.subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AssignmentModel.aggregate<{ teachers?: string[] }>([
        { $match: match },
        { $group: { _id: null, teachers: { $addToSet: '$teacherId' } } },
      ]),
      AssignmentModel.aggregate([
        { $match: { ...match, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateTrunc: { date: '$createdAt', unit: 'week', timezone: 'UTC' } },
            count: { $sum: 1 },
          },
        },
      ]),
      AssignmentModel.find(match)
        .select('_id status input.title input.subject input.dueDate createdAt')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
    ]);

    const wl = workloadAgg[0];
    const uniqueTeachers = teacherAgg[0]?.teachers?.length ?? 0;
    const today = startOfLocalDay(new Date());
    const DAY_MS = 86400000;

    const upcomingDue: Array<{
      _id: string;
      title: string;
      subject: string;
      status: string;
      dueDateRaw: string;
      dueAt: string | null;
      daysUntil: number | null;
      hrefPath: string;
    }> = [];

    let overdueCount = 0;
    let dueSoonCount = 0;

    for (const row of dueRows) {
      const id = String(row._id);
      const input = row.input as { title?: string; subject?: string; dueDate?: string } | undefined;
      const title = typeof input?.title === 'string' ? input.title : 'Untitled';
      const subject = typeof input?.subject === 'string' ? input.subject : '';
      const dueRaw = input?.dueDate ?? '';
      const status = String(row.status ?? '');
      const parsed = parseDueDateString(dueRaw);
      const hrefPath =
        status === 'completed' ? `/student/assignments/${id}/result` : `/student/assignments/${id}`;

      if (!parsed) continue;

      const dueStart = startOfLocalDay(parsed);
      const daysUntil = Math.round((dueStart.getTime() - today.getTime()) / DAY_MS);

      if (status === 'completed') {
        if (daysUntil < 0) overdueCount += 1;
        if (daysUntil >= 0 && daysUntil <= 7) dueSoonCount += 1;
      }

      upcomingDue.push({
        _id: id,
        title,
        subject,
        status,
        dueDateRaw: String(dueRaw),
        dueAt: dueStart.toISOString().slice(0, 10),
        daysUntil,
        hrefPath,
      });
    }

    upcomingDue.sort((a, b) => {
      const da = a.daysUntil ?? 9999;
      const db = b.daysUntil ?? 9999;
      if (da !== db) return da - db;
      return a.title.localeCompare(b.title);
    });

    const upcomingSlice = upcomingDue.slice(0, 8);

    function weekBucketKey(raw: unknown): string | null {
      if (raw == null) return null;
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    }

    const weekCounts = new Map<string, number>();
    for (const row of weeklyByTrunc) {
      const key = weekBucketKey(row._id);
      if (!key) continue;
      weekCounts.set(key, row.count);
    }
    const weeklyBuckets = buildWeeklyBucketSeries(since, weekCounts);

    res.json({
      totalShared,
      byStatus: { pending, processing, completed, failed },
      workload: {
        totalQuestions: wl?.totalQuestions ?? 0,
        totalMarks: Math.round((wl?.totalMarks ?? 0) * 10) / 10,
      },
      bySubject: subjectAgg.map((s) => ({
        subject: (s._id as string)?.trim() || 'Unknown',
        count: s.count,
      })),
      uniqueTeachers,
      overdueCount,
      dueSoonCount,
      upcomingDue: upcomingSlice,
      /** Zero-filled UTC week buckets (Monday start); matches Mongo $dateTrunc week. */
      weekly: weeklyBuckets,
    });
  } catch (error) {
    console.error('student analytics summary', error);
    res.status(500).json({ error: 'Failed to load analytics', code: 'INTERNAL_ERROR' });
  }
});

export default router;
