'use client';

import { create } from 'zustand';
import type {
  AssignmentInput,
  QuestionConfig,
  GeneratedPaper,
  Assignment,
  JobStatus,
} from '@vedaai/shared/types';

interface AssignmentStore {
  formData: Partial<AssignmentInput>;
  uploadedFile: File | null;
  currentAssignment: Assignment | null;
  assignments: Assignment[];
  jobStatus: JobStatus | null;
  jobProgress: number;
  jobMessage: string;
  generatedPaper: GeneratedPaper | null;

  setFormData: (data: Partial<AssignmentInput>) => void;
  setUploadedFile: (file: File | null) => void;
  setCurrentAssignment: (a: Assignment | null) => void;
  setAssignments: (assignments: Assignment[]) => void;
  updateJobStatus: (status: JobStatus, progress?: number, message?: string) => void;
  setGeneratedPaper: (paper: GeneratedPaper) => void;
  reset: () => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  formData: {},
  uploadedFile: null,
  currentAssignment: null,
  assignments: [],
  jobStatus: null,
  jobProgress: 0,
  jobMessage: '',
  generatedPaper: null,

  setFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),

  setUploadedFile: (file) => set({ uploadedFile: file }),

  setCurrentAssignment: (a) => set({ currentAssignment: a }),

  setAssignments: (assignments) => set({ assignments }),

  updateJobStatus: (status, progress = 0, message = '') =>
    set({ jobStatus: status, jobProgress: progress, jobMessage: message }),

  setGeneratedPaper: (paper) => set({ generatedPaper: paper }),

  reset: () =>
    set({
      formData: {},
      uploadedFile: null,
      currentAssignment: null,
      jobStatus: null,
      jobProgress: 0,
      jobMessage: '',
      generatedPaper: null,
    }),
}));

export type { Assignment, GeneratedPaper, AssignmentInput, QuestionConfig, JobStatus };
