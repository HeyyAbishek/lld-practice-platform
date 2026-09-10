import { Star } from 'lucide-react';
import type { Rank } from '../lib/ranks';

interface Props {
  rank: Rank;
  next: Rank | null;
  progress: number; // 0..1
  stars: number;
}

export function RankBadge({ rank, next, progress, stars }: Props) {
  return (
    <div className="card p-4 relative overflow-hidden">
      <div
        className="absolute -inset-px rounded-xl opacity-30 blur-xl pointer-events-none"
        style={{ background: rank.glow }}
      />
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rank.gradient} grid place-items-center text-2xl shadow-glow`}
          >
            {rank.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Rank</div>
            <div className="text-base font-bold text-white truncate">{rank.name}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 text-amber-300 font-semibold">
            <Star className="w-3 h-3 fill-amber-300" />
            {stars} stars
          </span>
          {next && (
            <span className="text-slate-500">
              {next.min - stars} to <span className="text-slate-300">{next.name}</span>
            </span>
          )}
        </div>
        <div className="h-1.5 bg-bg-elev rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${rank.gradient}`}
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
