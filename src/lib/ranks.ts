import type { Difficulty } from '../data/problems';

export const STARS_FOR: Record<Difficulty, number> = {
  easy: 2,
  medium: 5,
  hard: 10,
};

export interface Rank {
  name: string;
  /** Inclusive lower bound of stars */
  min: number;
  /** Tailwind color classes for the badge gradient */
  gradient: string;
  /** Plain hex for halo / glow */
  glow: string;
  icon: string;
}

/**
 * Star tiers. Grandmaster sits at the top — by request, 50 stars hits Grandmaster
 * (clearing every medium puts you within striking distance; a few hards push you over).
 */
export const RANKS: Rank[] = [
  { name: 'Novice',      min: 0,   gradient: 'from-slate-500 to-slate-700',     glow: '#94a3b8', icon: '◌' },
  { name: 'Apprentice',  min: 6,   gradient: 'from-emerald-400 to-teal-600',     glow: '#34d399', icon: '◆' },
  { name: 'Architect',   min: 15,  gradient: 'from-cyan-400 to-blue-600',        glow: '#22d3ee', icon: '✦' },
  { name: 'Specialist',  min: 28,  gradient: 'from-blue-500 to-indigo-700',      glow: '#6366f1', icon: '✪' },
  { name: 'Expert',      min: 40,  gradient: 'from-violet-500 to-fuchsia-600',   glow: '#a78bfa', icon: '★' },
  { name: 'Master',      min: 50,  gradient: 'from-fuchsia-500 to-rose-500',     glow: '#f472b6', icon: '✯' },
  { name: 'Grandmaster', min: 80,  gradient: 'from-amber-400 via-rose-500 to-fuchsia-600', glow: '#fbbf24', icon: '♛' },
  { name: 'Legend',      min: 150, gradient: 'from-yellow-300 via-amber-500 to-rose-600',  glow: '#fde047', icon: '☼' },
];

export function rankFor(stars: number): { rank: Rank; next: Rank | null; progress: number } {
  let current = RANKS[0];
  let next: Rank | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (stars >= RANKS[i].min) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    } else {
      break;
    }
  }
  const progress = next
    ? Math.min(1, (stars - current.min) / (next.min - current.min))
    : 1;
  return { rank: current, next, progress };
}
