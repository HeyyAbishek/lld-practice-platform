import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Github, Sparkles, Trash2, X } from 'lucide-react';
import { rankFor } from '../lib/ranks';
import { RankBadge } from './RankBadge';
import type { useProgress } from '../hooks/useProgress';

interface Props {
  progress: ReturnType<typeof useProgress>;
}

export function Sidebar({ progress }: Props) {
  const { totalStars, solvedCount, byDifficulty } = progress;
  const { rank, next, progress: rankProgress } = rankFor(totalStars);

  const total =
    byDifficulty.easy.total + byDifficulty.medium.total + byDifficulty.hard.total;
  const overall = total === 0 ? 0 : Math.round((solvedCount / total) * 100);

  return (
    <aside className="w-72 shrink-0 border-r border-bg-border bg-bg-surface/60 backdrop-blur-xl p-5 flex flex-col gap-6 sticky top-0 h-screen">
      {/* logo */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-glow to-accent-pink grid place-items-center shadow-glow">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white">LLD Arena</div>
          <div className="text-[11px] text-slate-400">Master design in Java</div>
        </div>
      </div>

      {/* rank */}
      <RankBadge rank={rank} next={next} progress={rankProgress} stars={totalStars} />

      {/* completion */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Overall completion</span>
          <span className="text-slate-200 font-semibold">{overall}%</span>
        </div>
        <div className="h-2 bg-bg-elev rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-glow via-accent to-accent-pink shimmer"
            style={{
              width: `${overall}%`,
              backgroundImage:
                'linear-gradient(90deg, #7c3aed 0%, #a78bfa 30%, #f472b6 60%, #a78bfa 100%)',
            }}
          />
        </div>
        <div className="text-[11px] text-slate-500">
          {solvedCount} / {total} problems solved
        </div>
      </div>

      <DifficultyBreakdown byDifficulty={byDifficulty} />

      <nav className="flex flex-col gap-1 mt-2">
        <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" end />
        <NavItem to="/problems" icon={<ListChecks className="w-4 h-4" />} label="Problems" />
      </nav>

      <div className="mt-auto pt-4 border-t border-bg-border space-y-2">
        <ResetButton onReset={progress.resetAll} />
        <a
          href="https://github.com/HeyyAbishek/lld-practice-platform"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Github className="w-4 h-4" />
          Built for SDE interviews
        </a>
      </div>
    </aside>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-rose-300 transition-colors px-2 py-1.5 rounded-md hover:bg-rose-500/5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Reset all progress
      </button>
      {open && (
        <ConfirmReset
          onConfirm={() => {
            onReset();
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ConfirmReset({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [phrase, setPhrase] = useState('');
  const required = 'reset';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="card w-[min(440px,94vw)] p-6 border-rose-500/30 relative">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 w-7 h-7 grid place-items-center rounded-md hover:bg-bg-elev text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 grid place-items-center">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Reset all progress?</h3>
            <p className="text-xs text-slate-400">This wipes stars, solved status, and saved drafts.</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-2">
          Type <code className="font-mono px-1.5 py-0.5 rounded bg-bg-elev text-rose-300 border border-bg-border">{required}</code> to confirm:
        </p>
        <input
          autoFocus
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          className="w-full px-3 py-2 bg-bg-elev border border-bg-border rounded-lg text-sm font-mono
                     focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
          placeholder="reset"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} className="btn-ghost px-3 py-1.5">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={phrase.trim().toLowerCase() !== required}
            className="btn bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white px-3 py-1.5
                       hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-40
                       disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset everything
          </button>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-gradient-to-r from-accent-glow/20 to-accent-pink/10 text-white border border-accent/30'
            : 'text-slate-400 hover:text-white hover:bg-bg-elev',
        ].join(' ')
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function DifficultyBreakdown({
  byDifficulty,
}: {
  byDifficulty: Record<'easy' | 'medium' | 'hard', { solved: number; total: number }>;
}) {
  const rows: { key: 'easy' | 'medium' | 'hard'; label: string; color: string }[] = [
    { key: 'easy', label: 'Easy', color: 'from-emerald-400 to-teal-500' },
    { key: 'medium', label: 'Medium', color: 'from-amber-400 to-orange-500' },
    { key: 'hard', label: 'Hard', color: 'from-rose-400 to-fuchsia-500' },
  ];
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const { solved, total } = byDifficulty[row.key];
        const pct = total === 0 ? 0 : (solved / total) * 100;
        return (
          <div key={row.key}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">{row.label}</span>
              <span className="text-slate-300 font-mono">
                {solved}/{total}
              </span>
            </div>
            <div className="h-1.5 bg-bg-elev rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}