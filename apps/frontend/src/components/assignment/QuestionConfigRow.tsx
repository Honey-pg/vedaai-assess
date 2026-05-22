'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { AssignmentFormData } from '@/lib/utils/validation';

interface QuestionConfigRowProps {
  index: number;
  register: UseFormRegister<AssignmentFormData>;
  errors: FieldErrors<AssignmentFormData>;
  onRemove: () => void;
  canRemove: boolean;
}

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
];

const difficulties = [
  { value: 'easy', label: 'Easy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'hard', label: 'Hard', color: 'bg-red-50 text-red-700 border-red-200' },
];

export function QuestionConfigRow({
  index,
  register,
  errors,
  onRemove,
  canRemove,
}: QuestionConfigRowProps) {
  const fieldErrors = errors.questionConfigs?.[index];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-muted/40 rounded-lg border border-border/50">
      <div className="md:col-span-3">
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Question Type
        </Label>
        <select
          {...register(`questionConfigs.${index}.type`)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {questionTypes.map((qt) => (
            <option key={qt.value} value={qt.value}>
              {qt.label}
            </option>
          ))}
        </select>
        {fieldErrors?.type && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.type.message}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Count
        </Label>
        <Input
          type="number"
          min={1}
          max={50}
          {...register(`questionConfigs.${index}.count`, { valueAsNumber: true })}
          className="h-9"
          placeholder="5"
        />
        {fieldErrors?.count && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.count.message}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Marks Each
        </Label>
        <Input
          type="number"
          min={1}
          max={100}
          {...register(`questionConfigs.${index}.marksPerQuestion`, { valueAsNumber: true })}
          className="h-9"
          placeholder="2"
        />
        {fieldErrors?.marksPerQuestion && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.marksPerQuestion.message}</p>
        )}
      </div>

      <div className="md:col-span-4">
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Difficulty
        </Label>
        <div className="flex gap-1.5">
          {difficulties.map((d) => (
            <label
              key={d.value}
              className="flex-1"
            >
              <input
                type="radio"
                value={d.value}
                {...register(`questionConfigs.${index}.difficulty`)}
                className="sr-only peer"
              />
              <div className={`text-center text-xs py-1.5 px-2 rounded-md border cursor-pointer transition-all peer-checked:ring-2 peer-checked:ring-primary/30 ${d.color}`}>
                {d.label}
              </div>
            </label>
          ))}
        </div>
        {fieldErrors?.difficulty && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.difficulty.message}</p>
        )}
      </div>

      <div className="md:col-span-1 flex justify-end">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
