import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Search, Star } from 'lucide-react';
import { PROBLEMS, type Difficulty } from '../data/problems';
import { STARS_FOR } from '../lib/ranks';
import type { useProgress } from '../hooks/useProgress';

interface Props {
  progress: ReturnType<typeof useProgress>;
}

type Filter = 'all' | Difficulty | 'solved' | 'unsolved';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
  { key: 'unsolved', label: 'Unsolved' },
  { key: 'solved', label: 'Solved' },
];

export function ProblemListPage({ progress }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return PROBLEMS.filter((p) => {
      if (filter === 'easy' || filter === 'medium' || filter === 'hard') {
        if (p.difficulty !== filter) return false;
      }
      if (filter === 'solved' && !progress.solved[p.slug]) return false;
      if (filter === 'unsolved' && progress.solved[p.slug]) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [filter, query, progress.solved]);

  return (
    <div className="px-10 py-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Problems</h1>
        <p className="text-sm text-slate-400">
          {PROBLEMS.length} hand-picked LLD problems. Easy gives {STARS_FOR.easy}★, medium{' '}
          {STARS_FOR.medium}★, hard {STARS_FOR.hard}★.
        </p>
      </header>

      {/* search + filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems / tags…"
            className="w-full pl-10 pr-3 py-2 bg-bg-surface border border-bg-border rounded-lg
                       text-sm placeholder:text-slate-500 focus:outline-none
                       focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-surface border border-bg-border rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                filter === f.key
                  ? 'bg-gradient-to-r from-accent-glow to-accent text-white shadow-glow'
                  : 'text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_120px_120px_80px] px-5 py-3 border-b border-bg-border text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          <div>#</div>
          <div>Title</div>
          <div>Difficulty</div>
          <div>Tags</div>
          <div className="text-right">Stars</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No problems match.
          </div>
        ) : (
          filtered.map((p, i) => {
            const solved = !!progress.solved[p.slug];
            return (
              <Link
                key={p.slug}
                to={`/problems/${p.slug}`}
                className="grid grid-cols-[40px_1fr_120px_120px_80px] items-center px-5 py-3
                           border-b border-bg-border/70 last:border-b-0 hover:bg-bg-elev/60
                           transition-colors group"
              >
                <div className="text-slate-500 text-sm">
                  {solved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                    <span className="text-slate-500 font-mono mr-2">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {p.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {p.concepts.slice(0, 3).join(' · ')}
                  </div>
                </div>
                <div>
                  <span className={`chip difficulty-${p.difficulty} capitalize`}>
                    {p.difficulty}
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {p.tags.slice(0, 2).map((t) => (
                    <span key={t} className="chip bg-bg-elev text-slate-400 text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-right text-sm font-semibold text-amber-300 flex items-center gap-1 justify-end">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  {STARS_FOR[p.difficulty]}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
