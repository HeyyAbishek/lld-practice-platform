/**
 * Client → Vite middleware: compile / run / grade.
 *
 * - `runJava(source, { tests })`     → POSTs to /api/run-java
 * - `gradeWithAI(problem, source)`   → POSTs to /api/grade (Groq, server-side key)
 */
import type { Problem } from '../data/problems';

export interface RunResult {
  stdout: string;
  stderr: string;
  compileError: string;
  exitCode: number | null;
  durationMs: number;
  ok: boolean;
  ranTests: boolean;
}

export interface TestSummary {
  pass: number;
  fail: number;
  cases: { name: string; ok: boolean; detail?: string }[];
}

export interface RubricScore {
  criterion: string;
  score: number; // 0..5
  comment: string;
}

export interface GradeResult {
  overall: number; // 0..100
  verdict: string;
  rubric_scores: RubricScore[];
  strengths: string[];
  improvements: string[];
  design_patterns_detected: string[];
}

export async function runJava(
  source: string,
  opts: { stdin?: string; tests?: string } = {},
): Promise<RunResult> {
  const t0 = performance.now();
  try {
    const res = await fetch('/api/run-java', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source, stdin: opts.stdin ?? '', tests: opts.tests ?? null }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return {
        stdout: '',
        stderr: '',
        compileError: `Local runner unreachable (HTTP ${res.status}). ${txt.slice(0, 300)}`,
        exitCode: null,
        durationMs: performance.now() - t0,
        ok: false,
        ranTests: false,
      };
    }
    const json = (await res.json()) as RunResult;
    return { ...json, durationMs: performance.now() - t0 };
  } catch (e: any) {
    return {
      stdout: '',
      stderr: '',
      compileError:
        'Could not reach the local Java runner. Is the dev server running?\n' +
        (e?.message ?? String(e)),
      exitCode: null,
      durationMs: performance.now() - t0,
      ok: false,
      ranTests: false,
    };
  }
}

/** Parse `[PASS] name` / `[FAIL] name — detail` lines plus a `Result: X passed, Y failed` line. */
export function parseTestSummary(stdout: string): TestSummary | null {
  const lines = stdout.split('\n');
  const cases: TestSummary['cases'] = [];
  for (const line of lines) {
    const m = line.match(/^\[(PASS|FAIL)\]\s+(.+?)(?:\s+—\s+(.+))?$/);
    if (m) {
      cases.push({ ok: m[1] === 'PASS', name: m[2], detail: m[3] });
    }
  }
  if (cases.length === 0) return null;
  const pass = cases.filter((c) => c.ok).length;
  return { pass, fail: cases.length - pass, cases };
}

export async function gradeWithAI(
  problem: Problem,
  source: string,
): Promise<{ result?: GradeResult; error?: string }> {
  const rubric =
    problem.rubric && problem.rubric.length > 0
      ? problem.rubric
      : problem.tests?.contract ?? problem.requirements;
  try {
    const res = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        problem: {
          title: problem.title,
          difficulty: problem.difficulty,
          description: problem.description,
        },
        rubric,
        source,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { error: `Grade endpoint HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }
    return (await res.json()) as { result?: GradeResult; error?: string };
  } catch (e: any) {
    return { error: e?.message ?? String(e) };
  }
}

/**
 * Heuristic check that the user's code is a real attempt — not just the bare
 * starter. Used as a final guard for rubric-only problems.
 */
export function hasMeaningfulWork(
  starter: string,
  current: string,
): { ok: boolean; reason: string; addedNonTrivialLines: number } {
  const norm = (s: string) =>
    s
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

  const starterSet = new Set(norm(starter));
  const currentLines = norm(current);
  const added = currentLines.filter((l) => !starterSet.has(l) && !l.startsWith('//'));
  const interesting = added.filter(
    (l) =>
      l.length > 3 &&
      !l.match(/^[}{)(;,]+$/) &&
      !l.match(/^System\.out\.println\("LLD Arena · /),
  );

  if (interesting.length < 4) {
    return {
      ok: false,
      reason:
        'Add more of your own code — the platform needs to see real LLD modeling beyond the starter.',
      addedNonTrivialLines: interesting.length,
    };
  }
  return { ok: true, reason: '', addedNonTrivialLines: interesting.length };
}
