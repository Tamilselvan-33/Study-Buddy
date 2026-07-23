import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Bookmark, UserPlus, Info, Calendar, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { MatchRecommendation } from '../../types';

interface PartnerCardProps {
  match: MatchRecommendation;
  onViewExplanation: (match: MatchRecommendation) => void;
  onInvite: (userId: string, name: string) => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ match, onViewExplanation, onInvite }) => {
  const [isSaved, setIsSaved] = useState(false);
  const p = match.user.profile;
  if (!p) return null;

  /* Score ring color — uses semantic tokens */
  const scoreStyle =
    match.compatibilityScore >= 85
      ? { bg: 'var(--success-light)', border: 'rgba(16,185,129,0.40)', text: 'var(--success-text)' }
      : match.compatibilityScore >= 70
      ? { bg: 'var(--accent-light)', border: 'var(--accent-border)', text: 'var(--accent-text)' }
      : { bg: 'var(--warning-light)', border: 'rgba(245,158,11,0.40)', text: 'var(--warning-text)' };

  return (
    <Card hoverGlow className="flex flex-col justify-between relative overflow-hidden group p-5">
      <div>
        {/* Header: avatar + score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
              alt={p.name}
              className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md group-hover:scale-105 transition-transform"
              style={{ border: '2px solid var(--accent-border)', background: 'var(--surface-2)' }}
            />
            <div>
              <h3 className="font-bold text-base leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-text)] transition-colors">
                {p.name}
              </h3>
              <p className="text-xs flex items-center gap-1 mt-0.5 text-[var(--text-muted)]">
                <GraduationCap className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
                {p.college || 'University'} · {p.year || 'Student'}
              </p>
              <span className="text-[11px] font-medium text-[var(--text-muted)]">{p.department}</span>
            </div>
          </div>

          {/* Score badge */}
          <div className="px-3 py-1.5 rounded-xl flex flex-col items-center shrink-0"
            style={{ background: scoreStyle.bg, border: `1px solid ${scoreStyle.border}` }}>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: scoreStyle.text }} />
              <span className="font-extrabold text-sm font-mono" style={{ color: scoreStyle.text }}>
                {match.compatibilityScore}%
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80" style={{ color: scoreStyle.text }}>
              Match
            </span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs line-clamp-2 italic mb-4 px-3 py-2 rounded-xl text-[var(--text-secondary)]"
          style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
          "{p.bio || 'Motivated learner looking for structured collaboration and study sessions.'}"
        </p>

        {/* Subjects */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold flex items-center gap-1 mb-1.5 text-[var(--text-muted)]">
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-text)' }} />
            Core Subjects:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {p.subjects && p.subjects.length > 0
              ? p.subjects.slice(0, 3).map((s) => <Badge key={s} variant="purple" size="sm">{s}</Badge>)
              : <span className="text-xs italic text-[var(--text-muted)]">No subjects specified</span>}
            {p.subjects && p.subjects.length > 3 && (
              <Badge variant="slate" size="sm">+{p.subjects.length - 3} more</Badge>
            )}
          </div>
        </div>

        {/* Match reasons */}
        {match.matchReasons && match.matchReasons.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl text-xs match-reason-panel">
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-[var(--accent-text)]">
              Why You Match:
            </span>
            {match.matchReasons.slice(0, 2).map((reason, idx) => (
              <div key={idx} className="flex items-center gap-1.5 mt-1 text-[var(--text-secondary)]">
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: 'var(--success-text)' }} />
                <span className="line-clamp-1">{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="p-2 rounded-xl flex items-center gap-2 stat-cell">
            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--info-text)' }} />
            <div className="truncate">
              <span className="block text-[10px] text-[var(--text-muted)]">Time</span>
              <span className="font-semibold text-[var(--text-primary)] truncate block">{p.preferredStudyTime}</span>
            </div>
          </div>
          <div className="p-2 rounded-xl flex items-center gap-2 stat-cell">
            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--error-text)' }} />
            <div className="truncate">
              <span className="block text-[10px] text-[var(--text-muted)]">Style</span>
              <span className="font-semibold text-[var(--text-primary)] truncate block">{p.learningStyle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 flex items-center justify-between gap-2"
        style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="p-2 rounded-xl border transition-colors"
          style={
            isSaved
              ? { background: 'var(--accent-light)', borderColor: 'var(--accent-border)', color: 'var(--accent-text)' }
              : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
          }
          onMouseEnter={(e) => { if (!isSaved) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; } }}
          onMouseLeave={(e) => { if (!isSaved) { (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
          title={isSaved ? 'Remove Bookmark' : 'Save Partner'}
        >
          <Bookmark className="w-4 h-4" />
        </button>
        <Button variant="outline" size="sm" onClick={() => onViewExplanation(match)} leftIcon={<Info className="w-3.5 h-3.5" />}>
          Match Details
        </Button>
        <Button variant="primary" size="sm" onClick={() => onInvite(match.userId, p.name)} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
          Invite
        </Button>
      </div>
    </Card>
  );
};
