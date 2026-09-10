import { useCallback, useEffect, useState } from 'react';
import { PROBLEMS, type Problem } from '../data/problems';
import { STARS_FOR } from '../lib/ranks';

export type SolvedMap = Record<string, { solvedAt: number; stars: number }>;
export type DraftsMap = Record<string, string>;

const SOLVED_KEY = 'lld-arena:solved';
const DRAFTS_KEY = 'lld-arena:drafts';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

export function useProgress() {
  const [solved, setSolved] = useState<SolvedMap>(() => load(SOLVED_KEY, {} as SolvedMap));
  const [drafts, setDrafts] = useState<DraftsMap>(() => load(DRAFTS_KEY, {} as DraftsMap));

  useEffect(() => save(SOLVED_KEY, solved), [solved]);
  useEffect(() => save(DRAFTS_KEY, drafts), [drafts]);

  const markSolved = useCallback((problem: Problem) => {
    setSolved((prev) => {
      if (prev[problem.slug]) return prev;
      return {
        ...prev,
        [problem.slug]: {
          solvedAt: Date.now(),
          stars: STARS_FOR[problem.difficulty],
        },
      };
    });
  }, []);

  const unsolve = useCallback((slug: string) => {
    setSolved((prev) => {
      const { [slug]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const saveDraft = useCallback((slug: string, code: string) => {
    setDrafts((prev) => ({ ...prev, [slug]: code }));
  }, []);

  const resetDraft = useCallback((slug: string) => {
    setDrafts((prev) => {
      const { [slug]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /** Nuke everything: solved problems, code drafts, and split-pane sizes. */
  const resetAll = useCallback(() => {
    setSolved({});
    setDrafts({});
    try {
      localStorage.removeItem(SOLVED_KEY);
      localStorage.removeItem(DRAFTS_KEY);
      // also wipe split-pane prefs so the layout resets
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('lld-arena:split:')) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const totalStars = Object.values(solved).reduce((s, v) => s + v.stars, 0);
  const solvedCount = Object.keys(solved).length;

  const byDifficulty = {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  } as Record<'easy' | 'medium' | 'hard', { solved: number; total: number }>;

  for (const p of PROBLEMS) {
    byDifficulty[p.difficulty].total += 1;
    if (solved[p.slug]) byDifficulty[p.difficulty].solved += 1;
  }

  return {
    solved,
    drafts,
    totalStars,
    solvedCount,
    byDifficulty,
    markSolved,
    unsolve,
    saveDraft,
    resetDraft,
    resetAll,
  };
}
