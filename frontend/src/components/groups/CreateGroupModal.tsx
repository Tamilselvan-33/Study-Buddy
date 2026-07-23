import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

const SUBJECTS = [
  'Data Structures & Algorithms',
  'Machine Learning & AI',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Software Architecture',
  'Database Systems',
  'Computer Networks',
  'Operating Systems',
  'Discrete Mathematics',
  'Linear Algebra',
  'Calculus',
  'Statistics & Probability',
  'Economics',
  'Literature',
  'History',
  'Psychology',
  'Other',
];

interface CreateGroupPayload {
  name: string;
  description: string;
  subject: string;
  maxMembers: number;
  isTemporary: boolean;
  meetingTime?: string;
  charter?: { objective: string; expectations: string[] };
}

interface Props {
  onClose: () => void;
  onCreate: (payload: CreateGroupPayload) => Promise<void>;
}

export const CreateGroupModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: '',
    maxMembers: 6,
    isTemporary: false,
    meetingTime: '',
    charterObjective: '',
    charterExpectations: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Group name is required.';
    if (!form.subject) e.subject = 'Please select a subject.';
    if (form.maxMembers < 2 || form.maxMembers > 20) e.maxMembers = 'Must be between 2 and 20.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const expectations = form.charterExpectations
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await onCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        subject: form.subject,
        maxMembers: form.maxMembers,
        isTemporary: form.isTemporary,
        meetingTime: form.meetingTime.trim() || undefined,
        charter:
          form.charterObjective.trim()
            ? { objective: form.charterObjective.trim(), expectations }
            : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-lg modal-bg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 progress-track">
          <motion.div
            className="h-full bg-[var(--accent)]"
            animate={{ width: step === 1 ? '50%' : '100%' }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Create Study Group</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Step {step} of 2</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g., DSA Prep Squad"
                  className={`input-base w-full rounded-xl px-4 py-2.5 text-sm ${
                    errors.name ? 'border-[var(--error)] focus:ring-[var(--error)]/30' : ''
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-[var(--error-text)] font-medium">{errors.name}</p>}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  Subject *
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  className={`input-base w-full rounded-xl px-4 py-2.5 text-sm ${
                    errors.subject ? 'border-[var(--error)] focus:ring-[var(--error)]/30' : ''
                  }`}
                >
                  <option value="">Select a subject…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.subject && <p className="mt-1 text-xs text-[var(--error-text)] font-medium">{errors.subject}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="What will this group focus on? What are your goals?"
                  rows={3}
                  className="input-base w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                />
              </div>

              {/* Max members & type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={form.maxMembers}
                    onChange={(e) => update('maxMembers', parseInt(e.target.value) || 2)}
                    className={`input-base w-full rounded-xl px-4 py-2.5 text-sm ${
                      errors.maxMembers ? 'border-[var(--error)] focus:ring-[var(--error)]/30' : ''
                    }`}
                  />
                  {errors.maxMembers && (
                    <p className="mt-1 text-xs text-[var(--error-text)] font-medium">{errors.maxMembers}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Type</label>
                  <button
                    type="button"
                    onClick={() => update('isTemporary', !form.isTemporary)}
                    className={`w-full py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      form.isTemporary
                        ? 'bg-[var(--warning-light)] border-[var(--warning-text)]/30 text-[var(--warning-text)]'
                        : 'input-base border-theme text-[var(--text-muted)]'
                    }`}
                  >
                    {form.isTemporary ? '⏱ Temporary' : '∞ Permanent'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Meeting Time */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  Preferred Meeting Time
                </label>
                <input
                  type="text"
                  value={form.meetingTime}
                  onChange={(e) => update('meetingTime', e.target.value)}
                  placeholder="e.g., Weekdays 8–10 PM IST"
                  className="input-base w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              {/* Charter Objective */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  Group Objective{' '}
                  <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.charterObjective}
                  onChange={(e) => update('charterObjective', e.target.value)}
                  placeholder="e.g., Crack FAANG interviews by December"
                  className="input-base w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              {/* Expectations */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                  Expectations / Rules{' '}
                  <span className="text-[var(--text-muted)] font-normal">(one per line)</span>
                </label>
                <textarea
                  value={form.charterExpectations}
                  onChange={(e) => update('charterExpectations', e.target.value)}
                  placeholder={`Attend at least 3 sessions per week\nComplete weekly LeetCode challenges\nShare progress updates on Discord`}
                  rows={4}
                  className="input-base w-full rounded-xl px-4 py-2.5 text-sm resize-none font-mono leading-relaxed"
                />
              </div>

              <div className="p-3 bg-[var(--accent-light)] border border-[var(--accent-border)] rounded-xl">
                <p className="text-xs text-[var(--accent-text)]">
                  <span className="font-semibold">💡 Pro tip:</span> Groups with a clear charter
                  have 3× higher long-term retention. Take a moment to define expectations.
                </p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex gap-3 mt-6">
            {step === 1 ? (
              <>
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleNext} className="flex-1">
                  Next →
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating…' : 'Create Group'}
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
