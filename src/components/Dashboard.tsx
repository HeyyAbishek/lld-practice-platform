import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Star, Target, Trophy } from 'lucide-react';
import { PROBLEMS } from '../data/problems';
import { rankFor, RANKS, STARS_FOR } from '../lib/ranks';
import type { useProgress } from '../hooks/useProgress';

interface Props {
  progress: ReturnType<typeof useProgress>;
}

export function Dashboard({ progress }: Props) {
  const { totalStars, solvedCount, solved, byDifficulty } = progress;
  const { rank, next, progress: rankProgress } = rankFor(totalStars);

  const recent = Object.entries(solved)
    .sort((a, b) => b[1].solvedAt - a[1].solvedAt)
    .slice(0, 5)
    .map(([slug]) => PROBLEMS.find((p) => p.slug === slug)!)
    .filter(Boolean);

  return (
    <div className="px-10 py-10 max-w-6xl mx-auto">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-glow/30 via-bg-surface to-accent-pink/20 border border-accent/20 p-8 mb-8">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent-glow/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-accent-pink/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-accent-pink text-xs font-semibold uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            LLD Arena · Java
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-3 max-w-2xl">
            Build the design muscle that{' '}
            <span className="bg-gradient-to-r from-accent to-accent-pink bg-clip-text text-transparent">
              ships interview offers.
            </span>
          </h1>
          <p className="text-slate-300/90 max-w-xl mb-6">
            {PROBLEMS.length} hand-picked LLD problems. Code each one in Java in a real
            compiler, climb from <span className="text-white font-semibold">{RANKS[0].name}</span>{' '}
            to <span className="text-amber-300 font-semibold">Grandmaster</span>, and earn
            stars as you go.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/problems" className="btn-primary">
              Browse problems <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/problems/parking-lot" className="btn-ghost">
              Start with Parking Lot
            </Link>
          </div>
        </div>
      </div>

      {/* stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Stars"
          value={totalStars}
          gradient="from-amber-400 to-orange-500"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Rank"
          value={rank.name}
          gradient={rank.gradient}
          subtitle={next ? `${next.min - totalStars} ★ to ${next.name}` : 'Max rank!'}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Solved"
          value={`${solvedCount}/${PROBLEMS.length}`}
          gradient="from-emerald-400 to-teal-500"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Next milestone"
          value={next ? next.name : 'Maxed'}
          gradient="from-violet-500 to-fuchsia-500"
          subtitle={next ? `${Math.round(rankProgress * 100)}% there` : ''}
        />
      </div>

      {/* difficulty breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DifficultyCard
          label="Easy"
          color="from-emerald-400 to-teal-500"
          solved={byDifficulty.easy.solved}
          total={byDifficulty.easy.total}
          stars={STARS_FOR.easy}
        />
        <DifficultyCard
          label="Medium"
          color="from-amber-400 to-orange-500"
          solved={byDifficulty.medium.solved}
          total={byDifficulty.medium.total}
          stars={STARS_FOR.medium}
        />
        <DifficultyCard
          label="Hard"
          color="from-rose-400 to-fuchsia-500"
          solved={byDifficulty.hard.solved}
          total={byDifficulty.hard.total}
          stars={STARS_FOR.hard}
        />
      </div>

      {/* recent activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recently solved</h2>
          <Link
            to="/problems"
            className="text-xs text-accent hover:text-accent-pink transition-colors flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-slate-500 py-6 text-center">
            No problems solved yet — pick one from the list and start designing.
          </div>
        ) : (
          <ul className="divide-y divide-bg-border">
            {recent.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/problems/${p.slug}`}
                  className="flex items-center justify-between py-3 hover:text-white text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">{p.title}</span>
                  </div>
                  <span className={`chip difficulty-${p.difficulty} capitalize`}>
                    {p.difficulty}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className="card p-4 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} grid place-items-center text-white`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function DifficultyCard({
  label,
  color,
  solved,
  total,
  stars,
}: {
  label: string;
  color: string;
  solved: number;
  total: number;
  stars: number;
}) {
  const pct = total === 0 ? 0 : (solved / total) * 100;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-white">{label}</div>
        <span className="chip bg-bg-elev text-slate-300">
          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
          {stars} per solve
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <div className="text-2xl font-bold text-white">{solved}</div>
        <div className="text-sm text-slate-500 mb-0.5">/ {total}</div>
      </div>
      <div className="h-1.5 bg-bg-elev rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
