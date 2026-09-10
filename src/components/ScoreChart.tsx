import { useEffect, useState } from 'react';
import { Award, Sparkles, Wand2, X } from 'lucide-react';
import type { GradeResult, RubricScore, TestSummary } from '../lib/runJava';

interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  grade: GradeResult | null;
  gradeError?: string;
  testSummary: TestSummary | null;
  problemTitle: string;
  awardedStars: number | null;
}

export function ScoreChart({
  open,
  loading,
  onClose,
  grade,
  gradeError,
  testSummary,
  problemTitle,
  awardedStars,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]">
      <div className="card w-[min(960px,94vw)] max-h-[90vh] overflow-y-auto p-7 relative shadow-2xl border-accent/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-md hover:bg-bg-elev text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-glow to-accent-pink grid place-items-center shadow-glow">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
              AI Code Review · {problemTitle}
            </div>
            <h2 className="text-xl font-bold text-white">Your design report</h2>
          </div>
        </div>

        {loading && <LoadingState />}

        {!loading && gradeError && !grade && (
          <div className="card p-5 border-rose-500/30 bg-rose-500/5 text-rose-200 text-sm">
            <div className="font-semibold mb-1">AI grader unavailable</div>
            <div className="text-rose-300/80 text-xs">{gradeError}</div>
            {testSummary && (
              <div className="mt-4 pt-4 border-t border-rose-500/20">
                <TestResults summary={testSummary} />
              </div>
            )}
          </div>
        )}

        {!loading && grade && (
          <div className="space-y-6">
            <OverallScore grade={grade} awardedStars={awardedStars} />
            {testSummary && <TestResults summary={testSummary} />}
            <RubricBreakdown scores={grade.rubric_scores} />
            <DualList
              strengths={grade.strengths}
              improvements={grade.improvements}
              patterns={grade.design_patterns_detected}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 350);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center py-10">
      <div className="inline-flex items-center gap-2 text-slate-400">
        <Sparkles className="w-5 h-5 text-accent animate-pulse" />
        <span className="text-sm">AI is reviewing your design{dots}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full bg-gradient-to-r from-accent-glow/40 to-accent-pink/40 shimmer"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function OverallScore({
  grade,
  awardedStars,
}: {
  grade: GradeResult;
  awardedStars: number | null;
}) {
  const score = Math.max(0, Math.min(100, grade.overall ?? 0));
  const color =
    score >= 80
      ? 'from-emerald-400 to-teal-500'
      : score >= 60
        ? 'from-amber-400 to-orange-500'
        : 'from-rose-400 to-fuchsia-500';
  return (
    <div className="flex items-center gap-6 card p-6 bg-gradient-to-br from-bg-surface to-bg-elev">
      <Donut score={score} gradient={color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-amber-300" />
          <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Overall design score
          </span>
        </div>
        <div className="text-2xl font-bold text-white mb-1">{score} / 100</div>
        <p className="text-sm text-slate-300/90">{grade.verdict}</p>
        {awardedStars != null && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            ★ +{awardedStars} stars earned
          </div>
        )}
      </div>
    </div>
  );
}

function Donut({ score, gradient }: { score: number; gradient: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const idA = `g-${gradient.replace(/[^a-z0-9]/gi, '')}-a`;
  const idB = `g-${gradient.replace(/[^a-z0-9]/gi, '')}-b`;
  // Pull the two color stops from the tailwind class name
  const [a, b] = gradient.match(/(emerald|teal|amber|orange|rose|fuchsia)-(\d+)/g) ?? [
    'emerald-400',
    'teal-500',
  ];
  const stopMap: Record<string, string> = {
    'emerald-400': '#34d399',
    'teal-500': '#14b8a6',
    'amber-400': '#fbbf24',
    'orange-500': '#f97316',
    'rose-400': '#fb7185',
    'fuchsia-500': '#d946ef',
  };
  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id={idA} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={stopMap[a] ?? '#34d399'} />
            <stop offset="100%" stopColor={stopMap[b] ?? '#14b8a6'} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#22232f" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={`url(#${idA})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-2xl font-bold text-white">{score}</div>
      </div>
    </div>
  );
}

function TestResults({ summary }: { summary: TestSummary }) {
  const allPass = summary.fail === 0;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Hidden tests
        </div>
        <div
          className={`chip ${
            allPass
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
          }`}
        >
          {summary.pass}/{summary.pass + summary.fail} passed
        </div>
      </div>
      <ul className="space-y-1.5">
        {summary.cases.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm py-1 px-2 rounded-md hover:bg-bg-elev/60"
          >
            <span className={c.ok ? 'text-emerald-400' : 'text-rose-400'}>
              {c.ok ? '✓' : '✗'}
            </span>
            <span className={c.ok ? 'text-slate-300' : 'text-slate-200'}>
              <span className="font-medium">{c.name}</span>
              {c.detail && (
                <span className="block text-xs text-rose-300/80 mt-0.5 font-mono">
                  {c.detail}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RubricBreakdown({ scores }: { scores: RubricScore[] }) {
  if (!scores || scores.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
        Design rubric breakdown
      </div>
      <ul className="space-y-3">
        {scores.map((s, i) => {
          const pct = Math.max(0, Math.min(5, s.score)) * 20;
          const grad =
            s.score >= 4
              ? 'from-emerald-400 to-teal-500'
              : s.score >= 2
                ? 'from-amber-400 to-orange-500'
                : 'from-rose-400 to-fuchsia-500';
          return (
            <li key={i} className="card p-3.5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="text-sm text-slate-200 leading-snug flex-1">{s.criterion}</div>
                <div className="text-sm font-bold text-white shrink-0 font-mono">
                  {s.score}/5
                </div>
              </div>
              <div className="h-1.5 bg-bg-elev rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${grad}`}
                  style={{
                    width: `${pct}%`,
                    transition: 'width .6s cubic-bezier(.2,.8,.2,1)',
                  }}
                />
              </div>
              {s.comment && (
                <div className="text-xs text-slate-400 mt-2">{s.comment}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DualList({
  strengths,
  improvements,
  patterns,
}: {
  strengths: string[];
  improvements: string[];
  patterns: string[];
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-widest text-emerald-300 font-semibold mb-2.5">
          What works
        </div>
        <ul className="space-y-1.5 text-sm text-slate-300">
          {strengths?.length ? (
            strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-400">▸</span>
                <span>{s}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500 text-xs">—</li>
          )}
        </ul>
        {patterns?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-bg-border">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Patterns detected
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patterns.map((p) => (
                <span
                  key={p}
                  className="chip bg-accent/10 text-accent border border-accent/20"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="card p-4">
        <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold mb-2.5">
          What to improve
        </div>
        <ul className="space-y-1.5 text-sm text-slate-300">
          {improvements?.length ? (
            improvements.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400">▸</span>
                <span>{s}</span>
              </li>
            ))
          ) : (
            <li className="text-slate-500 text-xs">—</li>
          )}
        </ul>
      </div>
    </div>
  );
}
