import { Router, type Request, type Response } from 'express';
import { AssignmentModel } from '../models/Assignment';

const router = Router();

/** Jobs that look stalled (helps teachers spot infra / queue issues). */
const STALE_IN_FLIGHT_MS = 45 * 60 * 1000;

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.vedaUser?.clerkUserId;
    if (!teacherId) {
      res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const base = { teacherId };
    const now = Date.now();
    const ms7 = 7 * 24 * 60 * 60 * 1000;
    const weekStart = new Date(now - ms7);
    const twoWeekStart = new Date(now - 2 * ms7);
    const staleBefore = new Date(now - STALE_IN_FLIGHT_MS);

    const [
      totalAssignments,
      pending,
      processing,
      completed,
      failed,
      bySubject,
      createdThisWeek,
      createdPriorWeek,
      finishedThisWeek,
      finishedPriorWeek,
      recentFailures,
      staleInFlight,
    ] = await Promise.all([
      AssignmentModel.countDocuments(base),
      AssignmentModel.countDocuments({ ...base, status: 'pending' }),
      AssignmentModel.countDocuments({ ...base, status: 'processing' }),
      AssignmentModel.countDocuments({ ...base, status: 'completed' }),
      AssignmentModel.countDocuments({ ...base, status: 'failed' }),
      AssignmentModel.aggregate([
        { $match: base },
        { $group: { _id: '$input.subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AssignmentModel.countDocuments({ ...base, createdAt: { $gte: weekStart } }),
      AssignmentModel.countDocuments({
        ...base,
        createdAt: { $gte: twoWeekStart, $lt: weekStart },
      }),
      AssignmentModel.countDocuments({
        ...base,
        status: 'completed',
        updatedAt: { $gte: weekStart },
      }),
      AssignmentModel.countDocuments({
        ...base,
        status: 'completed',
        updatedAt: { $gte: twoWeekStart, $lt: weekStart },
      }),
      AssignmentModel.find({ teacherId, status: 'failed' })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('_id input.title input.subject updatedAt error')
        .lean(),
      AssignmentModel.find({
        teacherId,
        status: { $in: ['pending', 'processing'] },
        updatedAt: { $lt: staleBefore },
      })
        .sort({ updatedAt: 1 })
        .limit(5)
        .select('_id input.title input.subject status updatedAt')
        .lean(),
    ]);

    const since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const weekly = await AssignmentModel.aggregate([
      { $match: { teacherId, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const failureRateTotal = completed + failed;
    const failureRatePct =
      failureRateTotal === 0 ? 0 : Math.round((failed / failureRateTotal) * 1000) / 10;

    const backlog = pending + processing;
    const pipelineSuccessPct =
      completed + failed === 0 ? 100 : Math.round((completed / (completed + failed)) * 1000) / 10;

    const attentionItems = [
      ...recentFailures.map((doc) => ({
        id: String(doc._id),
        title: doc.input?.title ?? 'Untitled',
        subject: doc.input?.subject ?? '',
        status: 'failed' as const,
        kind: 'failed' as const,
        updatedAt: doc.updatedAt.toISOString(),
        detail: doc.error ? String(doc.error).slice(0, 160) : undefined,
      })),
      ...staleInFlight.map((doc) => ({
        id: String(doc._id),
        title: doc.input?.title ?? 'Untitled',
        subject: doc.input?.subject ?? '',
        status: doc.status as 'pending' | 'processing',
        kind: 'stuck' as const,
        updatedAt: doc.updatedAt.toISOString(),
        detail:
          doc.status === 'processing'
            ? 'No completion for a while — check jobs or retry from the assignment page.'
            : 'Still queued unusually long — if this persists, try creating again or contact support.',
      })),
    ];

    res.json({
      totalAssignments,
      byStatus: { pending, processing, completed, failed },
      backlog,
      failureRatePct,
      pipelineSuccessPct,
      weekly: weekly.map((w) => ({ year: w._id.year, week: w._id.week, count: w.count })),
      bySubject: bySubject.map((row) => ({
        subject: row._id !== undefined && row._id !== null ? String(row._id) : 'Unknown',
        count: row.count,
      })),
      trends: {
        createdThisWeek,
        createdPriorWeek,
        finishedThisWeek,
        finishedPriorWeek,
      },
      attentionItems,
    });
  } catch (error) {
    console.error('analytics summary', error);
    res.status(500).json({ error: 'Failed to load analytics', code: 'INTERNAL_ERROR' });
  }
});

export default router;
