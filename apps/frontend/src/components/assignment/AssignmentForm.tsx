'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Minus, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { assignmentFormSchema, AssignmentFormData } from '@/lib/utils/validation';
import { fetchTeacherClasses, fetchTeacherClass, type TeacherClassListItem } from '@/lib/api/classesApi';
import { createAssignment } from '@/lib/api/assignments';
import { useAssignmentStore } from '@/lib/store/assignmentStore';

const questionTypeOptions = [
  { value: 'mcq', label: 'Multiple Choice Questions' },
  { value: 'short_answer', label: 'Short Questions' },
  { value: 'long_answer', label: 'Diagram/Graph-Based Questions' },
  { value: 'true_false', label: 'True / False Questions' },
  { value: 'fill_in_blank', label: 'Numerical Problems' },
];

export function AssignmentForm() {
  const router = useRouter();
  const { isLoaded: authLoaded, userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inviteEmailsRaw, setInviteEmailsRaw] = useState('');
  const [studentIdsJson, setStudentIdsJson] = useState('[]');
  const [savedClasses, setSavedClasses] = useState<TeacherClassListItem[]>([]);
  const [importClassId, setImportClassId] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const { uploadedFile } = useAssignmentStore();

  useEffect(() => {
    if (!authLoaded || !userId) return;
    let cancel = false;
    fetchTeacherClasses()
      .then((rows) => {
        if (!cancel) setSavedClasses(rows);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [authLoaded, userId]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: '',
      subject: '',
      topic: '',
      gradeLevel: '',
      dueDate: '',
      questionConfigs: [
        { type: 'mcq', count: 4, marksPerQuestion: 1, difficulty: 'medium' },
        { type: 'short_answer', count: 3, marksPerQuestion: 2, difficulty: 'medium' },
        { type: 'long_answer', count: 5, marksPerQuestion: 5, difficulty: 'medium' },
        { type: 'fill_in_blank', count: 5, marksPerQuestion: 5, difficulty: 'medium' },
      ],
      additionalInstructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questionConfigs' });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() cannot be memoized by React Compiler
  const watchedConfigs = watch('questionConfigs');
  const totalQuestions = watchedConfigs?.reduce((sum, c) => sum + (c?.count || 0), 0) || 0;
  const totalMarks = watchedConfigs?.reduce((sum, c) => sum + (c?.count || 0) * (c?.marksPerQuestion || 0), 0) || 0;

  function parseInviteEmails(raw: string): string[] {
    const parts = raw.split(/[\n,;]+/).map((s) => s.trim().toLowerCase());
    return [...new Set(parts.filter((p) => p.length > 3 && p.includes('@')))];
  }

  const mergeSavedClassIntoInvites = async () => {
    if (!importClassId) return;
    setSubmitError(null);
    setImportBusy(true);
    try {
      const c = await fetchTeacherClass(importClassId);
      const fromText = parseInviteEmails(inviteEmailsRaw);
      const mergedEmails = [...new Set([...fromText, ...(c.studentEmails ?? [])])];
      setInviteEmailsRaw(mergedEmails.join('\n'));

      let prevIds: string[] = [];
      try {
        const parsed = JSON.parse(studentIdsJson) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) prevIds = parsed;
      } catch {
        prevIds = [];
      }
      const mergedIds = [...new Set([...prevIds, ...(c.studentIds ?? [])])];
      setStudentIdsJson(JSON.stringify(mergedIds));
      setSubmitError(null);
    } catch {
      setSubmitError('Could not load saved class roster. Try again.');
    } finally {
      setImportBusy(false);
    }
  };

  const adjustValue = (index: number, field: 'count' | 'marksPerQuestion', delta: number) => {
    const current = watchedConfigs[index]?.[field] || 1;
    const next = Math.max(1, Math.min(field === 'count' ? 50 : 100, current + delta));
    setValue(`questionConfigs.${index}.${field}`, next);
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('subject', data.subject);
      formData.append('topic', data.topic);
      formData.append('gradeLevel', data.gradeLevel);
      formData.append('dueDate', data.dueDate);
      formData.append('questionConfigs', JSON.stringify(data.questionConfigs));
      if (data.additionalInstructions) formData.append('additionalInstructions', data.additionalInstructions);
      if (uploadedFile) formData.append('file', uploadedFile);

      const inviteEmails = parseInviteEmails(inviteEmailsRaw);
      formData.append('studentEmails', JSON.stringify(inviteEmails));

      try {
        const parsed = JSON.parse(studentIdsJson) as unknown;
        if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
          setSubmitError('Advanced: student IDs must be a JSON array of strings, e.g. ["user_xxx"]');
          setIsSubmitting(false);
          return;
        }
        formData.append('studentIds', JSON.stringify(parsed));
      } catch {
        setSubmitError('Advanced: invalid JSON for student IDs. Use [], or ["user_aaa","user_bbb"].');
        setIsSubmitting(false);
        return;
      }

      const result = await createAssignment(formData);
      router.push(`/assignments/${result.assignmentId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-white rounded-[14px] border border-[#E8ECF4] p-7 md:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] w-full max-w-[720px] mx-auto">
        {/* Section Header */}
        <h2 className="text-base font-semibold text-[#1A202C] mb-1">Assignment Details</h2>
        <p className="text-sm text-[#718096] mb-5">Basic information about your assignment</p>
        <div className="border-b border-[#E8ECF4] mb-6" />

        {/* File Upload */}
        <FileUpload />
        <p className="text-xs text-[#A0AEC0] text-center mt-2 mb-6">
          Upload images of your preferred document/image
        </p>

        {/* Due Date */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#1A202C] mb-2 block">Due Date</label>
          <input
            type="date"
            {...register('dueDate')}
            placeholder="DD-MM-YYYY"
            className="w-full h-10 border border-[#E8ECF4] rounded-lg px-3 text-sm text-[#1A202C] placeholder:text-[#A0AEC0] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none transition-colors"
          />
          {errors.dueDate && <p className="text-xs text-[#EF4444] mt-1">{errors.dueDate.message}</p>}
        </div>

        {/* Hidden fields for title, subject, topic, grade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-[#1A202C] mb-2 block">Title</label>
            <input
              {...register('title')}
              placeholder="e.g. Quiz on Electricity"
              className="w-full h-10 border border-[#E8ECF4] rounded-lg px-3 text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none"
            />
            {errors.title && <p className="text-xs text-[#EF4444] mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A202C] mb-2 block">Subject</label>
            <input
              {...register('subject')}
              placeholder="e.g. Science"
              className="w-full h-10 border border-[#E8ECF4] rounded-lg px-3 text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none"
            />
            {errors.subject && <p className="text-xs text-[#EF4444] mt-1">{errors.subject.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A202C] mb-2 block">Topic</label>
            <input
              {...register('topic')}
              placeholder="e.g. Electricity & Circuits"
              className="w-full h-10 border border-[#E8ECF4] rounded-lg px-3 text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none"
            />
            {errors.topic && <p className="text-xs text-[#EF4444] mt-1">{errors.topic.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#1A202C] mb-2 block">Grade / Class</label>
            <select
              {...register('gradeLevel')}
              className="w-full h-10 border border-[#E8ECF4] rounded-lg px-3 text-sm focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none"
            >
              <option value="">Select grade</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={`${i + 1}th`}>{i + 1}th</option>
              ))}
            </select>
            {errors.gradeLevel && <p className="text-xs text-[#EF4444] mt-1">{errors.gradeLevel.message}</p>}
          </div>
        </div>

        {/* Question Types Table */}
        <div className="mt-6">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center pb-2.5 border-b border-[#E8ECF4] mb-3">
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider">Question Type</span>
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider text-center w-28">No. of Questions</span>
            <span className="text-xs font-semibold text-[#718096] uppercase tracking-wider text-center w-28">Marks</span>
            <span className="w-8" />
          </div>

          {/* Question Rows */}
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center py-3 border-b border-[#F0F4FF]">
              <select
                {...register(`questionConfigs.${index}.type`)}
                className="h-10 border border-[#E8ECF4] rounded-lg px-3 text-sm min-w-[200px] focus:border-[#FF6B35] outline-none"
              >
                {questionTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Count */}
              <div className="flex items-center gap-1 w-28 justify-center">
                <button type="button" onClick={() => adjustValue(index, 'count', -1)}
                  className="h-7 w-7 rounded-full border border-[#E8ECF4] flex items-center justify-center text-[#718096] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">{watchedConfigs[index]?.count || 1}</span>
                <button type="button" onClick={() => adjustValue(index, 'count', 1)}
                  className="h-7 w-7 rounded-full border border-[#E8ECF4] flex items-center justify-center text-[#718096] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Marks */}
              <div className="flex items-center gap-1 w-28 justify-center">
                <button type="button" onClick={() => adjustValue(index, 'marksPerQuestion', -1)}
                  className="h-7 w-7 rounded-full border border-[#E8ECF4] flex items-center justify-center text-[#718096] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">{watchedConfigs[index]?.marksPerQuestion || 1}</span>
                <button type="button" onClick={() => adjustValue(index, 'marksPerQuestion', 1)}
                  className="h-7 w-7 rounded-full border border-[#E8ECF4] flex items-center justify-center text-[#718096] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Delete */}
              <div className="w-8 flex justify-center">
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)}
                    className="text-[#EF4444] hover:text-[#DC2626] transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <input type="hidden" {...register(`questionConfigs.${index}.difficulty`)} />
            </div>
          ))}

          {/* Add + Totals */}
          <button
            type="button"
            onClick={() => append({ type: 'mcq', count: 5, marksPerQuestion: 2, difficulty: 'medium' })}
            className="mt-3 text-sm font-medium text-[#FF6B35] hover:text-[#E55A24] transition-colors flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Question Type
          </button>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E8ECF4]">
            <span className="text-sm font-semibold text-[#1A202C]">Total Questions : {totalQuestions}</span>
            <span className="text-sm font-semibold text-[#1A202C]">Total Marks : {totalMarks}</span>
          </div>
        </div>

        {/* Additional Instructions */}
        <div className="mt-6">
          <label className="text-sm font-medium text-[#1A202C] mb-2 block">
            Additional Information (For better output)
          </label>
          <textarea
            {...register('additionalInstructions')}
            placeholder="e.g Generate a question paper for 3 hour exam duration..."
            rows={3}
            className="w-full border border-[#E8ECF4] rounded-lg p-3 text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 outline-none resize-none"
          />
        </div>

        <div className="mt-5 rounded-xl border border-[#edf0f9] bg-[#fafbff] px-4 py-3">
          <label className="text-sm font-medium text-[#1A202C] mb-2 flex flex-wrap gap-2 justify-between items-baseline">
            <span>Use a saved roster</span>
            <Link
              href="/classes"
              className="text-xs font-semibold text-[#FF6B35] hover:underline underline-offset-2"
            >
              Manage classes →
            </Link>
          </label>
          {savedClasses.length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch mb-4">
              <select
                value={importClassId}
                onChange={(e) => setImportClassId(e.target.value)}
                className="flex-1 h-11 border border-[#E8ECF4] rounded-lg px-3 text-sm bg-white focus:border-[#FF6B35] outline-none"
              >
                <option value="">Select one of your cohorts…</option>
                {savedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.subject ? ` · ${c.subject}` : ''}{' '}
                    ({Math.max(c.inviteCount, c.linkedAccountCount)} on roster)
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={importBusy || !importClassId}
                onClick={() => void mergeSavedClassIntoInvites()}
                className="h-11 px-4 shrink-0 rounded-lg bg-[#111] text-white text-sm font-bold hover:bg-black disabled:opacity-45 whitespace-nowrap"
              >
                {importBusy ? 'Merging…' : 'Merge into invites'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">
              No saved cohorts yet. Create one under <strong>My Classes</strong> — then importing takes one click here.
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-[#1A202C] mb-2 block">
            Invite students by email <span className="text-muted-foreground font-normal">(recommended)</span>
          </label>
          <textarea
            value={inviteEmailsRaw}
            onChange={(e) => setInviteEmailsRaw(e.target.value)}
            placeholder="student1@school.edu, student2@school.edu (one per line or comma-separated)"
            rows={4}
            className="w-full border border-[#E8ECF4] rounded-lg p-3 text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] outline-none resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Students see an assignment here when its list includes the same email they use to sign in to VedaAI.
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm font-medium text-[#1A202C] mb-2 block">
            Alternative: Clerk user IDs <span className="text-muted-foreground font-normal">(advanced, optional)</span>
          </label>
          <textarea
            value={studentIdsJson}
            onChange={(e) => setStudentIdsJson(e.target.value)}
            placeholder='JSON array — e.g. ["user_2abc...", "user_9xyz..."] or []'
            rows={3}
            className="w-full border border-[#E8ECF4] rounded-lg p-3 text-xs sm:text-sm placeholder:text-[#A0AEC0] focus:border-[#FF6B35] outline-none resize-none font-mono"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use this if you already have internal user IDs instead of emails.
          </p>
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#EF4444]">
            {submitError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 h-10 px-6 border border-[#E8ECF4] bg-white rounded-lg text-sm font-medium text-[#4A5568] hover:bg-[#F8F9FC] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 h-10 px-6 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E55A24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
