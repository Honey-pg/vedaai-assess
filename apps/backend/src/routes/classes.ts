import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { TeacherClassModel } from '../models/TeacherClass';
import { normalizeUserEmail } from '../utils/studentAssignmentScope';
import {
  requireAuthenticatedUser,
  syncVedaUser,
  requireTeacher,
  requireStudent,
} from '../middleware/authContext';

const router = Router();

/** Lean doc shape returned from mongoose (.lean()); typed for TS inference noise. */
type LeanClassDoc = {
  _id: mongoose.Types.ObjectId;
  teacherId?: string;
  name: string;
  joinCode: string;
  subject?: string | null;
  description?: string | null;
  studentEmails: string[];
  studentIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

function routeParamString(p: string | string[] | undefined): string | null {
  const v = Array.isArray(p) ? p[0] : p;
  return typeof v === 'string' ? v : null;
}

router.use(requireAuthenticatedUser, syncVedaUser);

const JOIN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateJoinCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += JOIN_CHARS[Math.floor(Math.random() * JOIN_CHARS.length)];
  }
  return s;
}

const joinBodySchema = z.object({
  code: z.string().trim().transform((v) => v.toUpperCase()),
});

router.post('/join', requireStudent, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = joinBodySchema.parse(req.body ?? {});
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      res.status(400).json({ error: 'Code must be 6 characters.', code: 'INVALID_CODE' });
      return;
    }

    const klassRaw = await TeacherClassModel.findOne({ joinCode: code }).lean();
    const klass = klassRaw as LeanClassDoc | null;
    if (!klass) {
      res.status(404).json({ error: 'No class matched that code. Check with your teacher.', code: 'NOT_FOUND' });
      return;
    }

    const studentId = req.vedaUser!.clerkUserId;
    const email = normalizeUserEmail(req.vedaUser!);

    await TeacherClassModel.findByIdAndUpdate(klass._id, {
      $addToSet: {
        studentIds: studentId,
        ...(email ? { studentEmails: email } : {}),
      },
    });

    res.json({
      ok: true as const,
      className: klass.name,
      joinCode: klass.joinCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.message, code: 'BAD_REQUEST' });
      return;
    }
    console.error('classes/join', error);
    res.status(500).json({ error: 'Could not join class', code: 'INTERNAL_ERROR' });
  }
});

const createSchema = z.object({
  name: z.string().min(2).max(80),
  subject: z.string().max(60).optional(),
  description: z.string().max(500).optional(),
});

router.post('/', requireTeacher, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = createSchema.parse(req.body ?? {});
    const teacherId = req.vedaUser!.clerkUserId;

    let joinCode = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      joinCode = generateJoinCode();
      const clash = await TeacherClassModel.exists({ joinCode });
      if (!clash) break;
    }
    if (!joinCode) {
      res.status(500).json({ error: 'Could not allocate join code', code: 'INTERNAL_ERROR' });
      return;
    }

    const doc = await TeacherClassModel.create({
      teacherId,
      name: body.name.trim(),
      subject: body.subject?.trim() || undefined,
      description: body.description?.trim() || undefined,
      joinCode,
      studentEmails: [],
      studentIds: [],
    });

    res.status(201).json(
      serializeBrief(doc.toObject() as unknown as Record<string, unknown>)
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.message, code: 'BAD_REQUEST' });
      return;
    }
    console.error('classes create', error);
    res.status(500).json({ error: 'Failed to create class', code: 'INTERNAL_ERROR' });
  }
});

router.get('/', requireTeacher, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.vedaUser!.clerkUserId;
    const rows = await TeacherClassModel.find({ teacherId }).sort({ updatedAt: -1 }).lean();

    res.json(rows.map((r) => serializeListItem(r as unknown as Record<string, unknown>)));
  } catch (error) {
    console.error('classes list', error);
    res.status(500).json({ error: 'Failed to list classes', code: 'INTERNAL_ERROR' });
  }
});

router.get('/:id', requireTeacher, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.vedaUser!.clerkUserId;
    const id = routeParamString(req.params.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id', code: 'BAD_REQUEST' });
      return;
    }

    const docRaw = await TeacherClassModel.findOne({ _id: id, teacherId }).lean();
    const doc = docRaw as LeanClassDoc | null;
    if (!doc) {
      res.status(404).json({ error: 'Class not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(serializeDetail(doc as unknown as Record<string, unknown>));
  } catch (error) {
    console.error('classes get', error);
    res.status(500).json({ error: 'Failed to load class', code: 'INTERNAL_ERROR' });
  }
});

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  subject: z.string().max(60).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  studentEmails: z
    .array(z.string())
    .optional()
    .transform((arr) =>
      [
        ...new Set(
          (arr ?? []).map((e) => e.trim().toLowerCase()).filter((e) => e.length > 3 && e.includes('@'))
        ),
      ]
    ),
});

router.patch('/:id', requireTeacher, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.vedaUser!.clerkUserId;
    const id = routeParamString(req.params.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id', code: 'BAD_REQUEST' });
      return;
    }

    const body = patchSchema.parse(req.body ?? {});
    const $set: Record<string, unknown> = {};

    if (body.name !== undefined) $set.name = body.name.trim();
    if (body.subject !== undefined) $set.subject = body.subject?.trim() || undefined;
    if (body.description !== undefined) $set.description = body.description?.trim() || undefined;
    if (body.studentEmails !== undefined) {
      $set.studentEmails = body.studentEmails;
    }

    if (Object.keys($set).length === 0) {
      const existingRaw = await TeacherClassModel.findOne({ _id: id, teacherId }).lean();
      const existing = existingRaw as LeanClassDoc | null;
      if (!existing) {
        res.status(404).json({ error: 'Class not found', code: 'NOT_FOUND' });
        return;
      }
      res.json(serializeDetail(existing as unknown as Record<string, unknown>));
      return;
    }

    const updatedRaw = await TeacherClassModel.findOneAndUpdate(
      { _id: id, teacherId },
      { $set },
      { new: true }
    ).lean();

    const doc = updatedRaw as LeanClassDoc | null;

    if (!doc) {
      res.status(404).json({ error: 'Class not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(serializeDetail(doc as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.message, code: 'BAD_REQUEST' });
      return;
    }
    console.error('classes patch', error);
    res.status(500).json({ error: 'Failed to update class', code: 'INTERNAL_ERROR' });
  }
});

router.delete('/:id', requireTeacher, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.vedaUser!.clerkUserId;
    const id = routeParamString(req.params.id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid id', code: 'BAD_REQUEST' });
      return;
    }

    const result = await TeacherClassModel.deleteOne({ _id: id, teacherId });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Class not found', code: 'NOT_FOUND' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('classes delete', error);
    res.status(500).json({ error: 'Failed to delete class', code: 'INTERNAL_ERROR' });
  }
});

// --- serializers

function serializeBrief(doc: Record<string, unknown>): Record<string, unknown> {
  return {
    id: String(doc._id),
    name: doc.name as string,
    subject: doc.subject,
    description: doc.description,
    joinCode: doc.joinCode,
    inviteCount: (doc.studentEmails as string[])?.length ?? 0,
    linkedAccountCount: (doc.studentIds as string[])?.length ?? 0,
    updatedAt: (doc.updatedAt as Date)?.toISOString?.() ?? null,
    createdAt: (doc.createdAt as Date)?.toISOString?.() ?? null,
  };
}

function serializeListItem(doc: Record<string, unknown>): Record<string, unknown> {
  return serializeBrief(doc);
}

function serializeDetail(doc: Record<string, unknown>): Record<string, unknown> {
  const emails = (doc.studentEmails as string[]) ?? [];
  const ids = (doc.studentIds as string[]) ?? [];
  const uniqueEmails = [...new Set(emails)].sort();
  return {
    ...serializeBrief(doc),
    studentEmails: uniqueEmails,
    studentIds: ids,
  };
}

export default router;
