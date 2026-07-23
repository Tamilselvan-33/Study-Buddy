import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, AlertTriangle, BookOpen, Clock, Zap, Target, UserPlus } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { MatchRecommendation } from '../../types';

interface MatchExplanationModalProps {
  match: MatchRecommendation | null;
  onClose: () => void;
  onInvite: (userId: string, name: string) => void;
}

export const MatchExplanationModal: React.FC<MatchExplanationModalProps> = ({ match, onClose, onInvite }) => {
  if (!match) return null;
  const p = match.user.profile;
  if (!p) return null;

  const factors = [
    { label: 'Subject', weight: '40%', score: match.subjectScore, icon: BookOpen, color: 'var(--accent-text)' },
    { label: 'Learning Style', weight: '15%', score: match.learningStyleScore, icon: Zap, color: 'var(--accent-2)' },
    { label: 'Skill & Goals', weight: '20%', score: match.skillScore, icon: Target, color: 'var(--success-text)' },
    { label: 'Schedule', weight: '10%', score: match.scheduleScore, icon: Clock, color: 'var(--info-text)' },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-[var(--shadow-modal)] max-h-[90vh] flex flex-col"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-3) 100%)',
              borderBottom: '1px solid var(--border)',
            }}>
            <div className="flex items-center gap-3">
              <img
                src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                alt={p.name}
                className="w-12 h-12 rounded-2xl object-cover"
                style={{ border: '2px solid var(--accent-border)', background: 'var(--surface-2)' }}
              />
              <div>
                <h3 className="font-bold text-lg leading-tight text-[var(--text-primary)]">{p.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {p.college} · {p.department} ({p.year})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-xl flex items-center gap-1 font-extrabold font-mono text-sm"
                style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                {match.compatibilityScore}% Match
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-xl transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Factor scores */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-[var(--text-muted)]">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
                Vector Factor Score Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {factors.map(({ label, weight, score, icon: Icon, color }) => (
                  <div key={label} className="p-3 rounded-2xl"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                    <span className="text-[10px] flex items-center gap-1 mb-1 text-[var(--text-muted)]">
                      <Icon className="w-3 h-3" style={{ color }} />
                      {label} ({weight})
                    </span>
                    <span className="text-base font-extrabold font-mono" style={{ color }}>
                      {score}%
                    </span>
                    <div className="mt-1.5 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Conflicts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl space-y-2"
                style={{ background: 'var(--success-light)', border: '1px solid rgba(16,185,129,0.30)' }}>
                <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--success-text)' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Key Match Strengths
                </h5>
                <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                  {match.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-bold" style={{ color: 'var(--success-text)' }}>•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl space-y-2"
                style={{ background: 'var(--warning-light)', border: '1px solid rgba(245,158,11,0.30)' }}>
                <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: 'var(--warning-text)' }}>
                  <AlertTriangle className="w-4 h-4" />
                  Potential Differences
                </h5>
                <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                  {match.potentialConflicts.map((conf, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="font-bold" style={{ color: 'var(--warning-text)' }}>•</span>
                      <span>{conf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Full profile */}
            <div className="p-4 rounded-2xl space-y-3"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Full Learning Profile
              </h5>
              <p className="text-xs italic text-[var(--text-secondary)]">"{p.bio}"</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="purple">Skill: {p.skillLevel}</Badge>
                <Badge variant="blue">Time: {p.preferredStudyTime}</Badge>
                <Badge variant="emerald">Commitment: {p.commitmentLevel}</Badge>
                <Badge variant="slate">Comm: {p.communicationPref}</Badge>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 flex justify-end gap-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="primary" leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => { onClose(); onInvite(match.userId, p.name); }}>
              Send Group Invite
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
