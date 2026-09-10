import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  Wand2,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { MermaidDiagram } from './MermaidDiagram';
import { ScoreChart } from './ScoreChart';
import { Split } from './Split';
import { getProblem, PROBLEMS, type Problem } from '../data/problems';
import { STARS_FOR } from '../lib/ranks';
import {
  gradeWithAI,
  hasMeaningfulWork,
  parseTestSummary,
  runJava,
  type GradeResult,
  type RunResult,
  type TestSummary,
} from '../lib/runJava';
import type { useProgress } from '../hooks/useProgress';

interface Props {
  progress: ReturnType<typeof useProgress>;
}

export function ProblemDetailPage({ progress }: Props) {
  const { slug = '' } = useParams();
  const problem = getProblem(slug);
  if (!problem) return <NotFound />;
  return <ProblemView key={problem.slug} problem={problem} progress={progress} />;
}

function NotFound() {
  return (
    <div className="p-10">
      <Link to="/problems" className="text-accent hover:text-accent-pink text-sm">
        ← Back to problems
      </Link>
      <h1 className="text-2xl font-bold mt-4">Problem not found</h1>
    </div>
  );
}

type PaneMode = 'normal' | 'editor-full' | 'description-full';

function ProblemView({
  problem,
  progress,
}: {
  problem: Problem;
  progress: ReturnType<typeof useProgress>;
}) {
  const [code, setCode] = useState<string>(
    () => progress.drafts[problem.slug] ?? problem.starter,
  );
  const [output, setOutput] = useState<RunResult | null>(null);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // rubric checklist state
  const [rubricChecks, setRubricChecks] = useState<boolean[]>(
    () => (problem.rubric ?? []).map(() => false),
  );

  // AI grade modal state
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [gradeError, setGradeError] = useState<string | undefined>();
  const [chartOpen, setChartOpen] = useState(false);
  const [awardedStars, setAwardedStars] = useState<number | null>(null);

  // layout
  const [paneMode, setPaneMode] = useState<PaneMode>('normal');

  // autosave
  useEffect(() => {
    const t = setTimeout(() => progress.saveDraft(problem.slug, code), 300);
    return () => clearTimeout(t);
  }, [code, problem.slug, progress]);

  const alreadySolved = !!progress.solved[problem.slug];
  const stars = STARS_FOR[problem.difficulty];

  const index = PROBLEMS.findIndex((p) => p.slug === problem.slug);
  const prev = index > 0 ? PROBLEMS[index - 1] : null;
  const next = index < PROBLEMS.length - 1 ? PROBLEMS[index + 1] : null;

  const handleRun = async () => {
    setRunning(true);
    setSubmitFeedback(null);
    const r = await runJava(code);
    setOutput(r);
    setTestSummary(null);
    setRunning(false);
  };

  const handleSubmit = async () => {
    setRunning(true);
    setSubmitFeedback(null);
    setGrade(null);
    setGradeError(undefined);
    setAwardedStars(null);

    const meaningful = hasMeaningfulWork(problem.starter, code);
    if (!meaningful.ok) {
      setRunning(false);
      setSubmitFeedback({ ok: false, msg: meaningful.reason });
      return;
    }

    // 1. compile + run (with tests if available)
    const r = await runJava(code, { tests: problem.tests?.body });
    setOutput(r);
    const summary = r.ranTests ? parseTestSummary(r.stdout) : null;
    setTestSummary(summary);
    setRunning(false);

    if (!r.ok) {
      setSubmitFeedback({
        ok: false,
        msg: r.compileError
          ? 'Compile error — fix it and resubmit.'
          : summary
            ? `Tests failed: ${summary.fail} of ${summary.fail + summary.pass}.`
            : 'Runtime error — your program crashed.',
      });
      return;
    }

    // 2. rubric check (only if no auto-tests)
    if (!problem.tests && problem.rubric) {
      const allChecked = rubricChecks.every(Boolean);
      if (!allChecked) {
        setSubmitFeedback({
          ok: false,
          msg: 'Confirm each rubric item under "How this is judged" first.',
        });
        return;
      }
    }

    // 3. award stars
    const earned = !alreadySolved ? stars : 0;
    if (!alreadySolved) progress.markSolved(problem);
    setAwardedStars(earned);
    setSubmitFeedback({
      ok: true,
      msg:
        earned > 0
          ? `Nice. +${earned}★ awarded.`
          : 'Already solved — solution updated.',
    });

    // 4. kick off AI grading (non-blocking for stars)
    setChartOpen(true);
    setGrading(true);
    const { result, error } = await gradeWithAI(problem, code);
    setGrading(false);
    if (result) setGrade(result);
    if (error) setGradeError(error);
  };

  const handleReset = () => {
    if (!confirm('Reset code to the starter template?')) return;
    setCode(problem.starter);
    progress.resetDraft(problem.slug);
    setOutput(null);
    setTestSummary(null);
    setSubmitFeedback(null);
  };

  // Memoize description/editor panes so resizing doesn't trigger Monaco re-mounts.
  const descriptionPane = useMemo(
    () => (
      <Description
        problem={problem}
        rubricChecks={rubricChecks}
        setRubricChecks={setRubricChecks}
      />
    ),
    [problem, rubricChecks],
  );

  const editorPane = (
    <EditorPane
      code={code}
      onChange={setCode}
      running={running}
      onRun={handleRun}
      onSubmit={handleSubmit}
      onReset={handleReset}
      alreadySolved={alreadySolved}
      output={output}
      testSummary={testSummary}
      submitFeedback={submitFeedback}
      onOpenReport={() => setChartOpen(true)}
      hasReport={!!grade}
    />
  );

  return (
    <div className="h-screen flex flex-col">
      <Header
        problem={problem}
        alreadySolved={alreadySolved}
        stars={stars}
        prev={prev}
        next={next}
        paneMode={paneMode}
        setPaneMode={setPaneMode}
      />
      <div className="flex-1 min-h-0">
        {paneMode === 'editor-full' ? (
          editorPane
        ) : paneMode === 'description-full' ? (
          <section className="h-full overflow-y-auto border-r border-bg-border bg-bg-surface/40">
            {descriptionPane}
          </section>
        ) : (
          <Split
            id={`detail-${problem.slug}`}
            direction="horizontal"
            defaultRatio={0.42}
            first={
              <section className="h-full overflow-y-auto border-r border-bg-border bg-bg-surface/40">
                {descriptionPane}
              </section>
            }
            second={editorPane}
            className="h-full"
          />
        )}
      </div>

      <ScoreChart
        open={chartOpen}
        loading={grading}
        onClose={() => setChartOpen(false)}
        grade={grade}
        gradeError={gradeError}
        testSummary={testSummary}
        problemTitle={problem.title}
        awardedStars={awardedStars}
      />
    </div>
  );
}

// ───────────────────────────── Header ─────────────────────────────────────

function Header({
  problem,
  alreadySolved,
  stars,
  prev,
  next,
  paneMode,
  setPaneMode,
}: {
  problem: Problem;
  alreadySolved: boolean;
  stars: number;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  paneMode: PaneMode;
  setPaneMode: (m: PaneMode) => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-bg-border bg-bg-surface/70 backdrop-blur">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/problems"
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          All
        </Link>
        <div className="w-px h-5 bg-bg-border" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white truncate">{problem.title}</h1>
            <span className={`chip difficulty-${problem.difficulty} capitalize shrink-0`}>
              {problem.difficulty}
            </span>
            <span className="chip bg-bg-elev text-amber-300 shrink-0">
              <Star className="w-3 h-3 fill-amber-300" />
              {stars}
            </span>
            {problem.tests ? (
              <span className="chip bg-accent/15 text-accent border border-accent/30 shrink-0">
                <Wand2 className="w-3 h-3" /> Auto-graded
              </span>
            ) : (
              <span className="chip bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0">
                <ClipboardList className="w-3 h-3" /> Design rubric
              </span>
            )}
            {alreadySolved && (
              <span className="chip bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-1">
            {problem.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wide text-slate-500"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <LayoutButtons paneMode={paneMode} setPaneMode={setPaneMode} />
        <div className="w-px h-5 bg-bg-border mx-1" />
        {prev && (
          <Link
            to={`/problems/${prev.slug}`}
            title={prev.title}
            className="btn-ghost px-3 py-1.5"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Prev
          </Link>
        )}
        {next && (
          <Link
            to={`/problems/${next.slug}`}
            title={next.title}
            className="btn-ghost px-3 py-1.5"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </header>
  );
}

function LayoutButtons({
  paneMode,
  setPaneMode,
}: {
  paneMode: PaneMode;
  setPaneMode: (m: PaneMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-bg-elev rounded-lg p-1 border border-bg-border">
      <LayoutBtn
        active={paneMode === 'description-full'}
        onClick={() =>
          setPaneMode(paneMode === 'description-full' ? 'normal' : 'description-full')
        }
        title="Description-only"
        icon={<BookOpen className="w-3.5 h-3.5" />}
      />
      <LayoutBtn
        active={paneMode === 'normal'}
        onClick={() => setPaneMode('normal')}
        title="Split view"
        icon={
          <div className="flex gap-0.5">
            <span className="w-1 h-3 rounded-sm bg-current" />
            <span className="w-1 h-3 rounded-sm bg-current opacity-60" />
          </div>
        }
      />
      <LayoutBtn
        active={paneMode === 'editor-full'}
        onClick={() =>
          setPaneMode(paneMode === 'editor-full' ? 'normal' : 'editor-full')
        }
        title="Editor-only"
        icon={<Maximize2 className="w-3.5 h-3.5" />}
      />
    </div>
  );
}

function LayoutBtn({
  active,
  onClick,
  title,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'px-2 py-1 rounded-md transition-all',
        active
          ? 'bg-gradient-to-r from-accent-glow to-accent text-white shadow-glow'
          : 'text-slate-400 hover:text-white',
      ].join(' ')}
    >
      {icon}
    </button>
  );
}

// ───────────────────────────── Description pane ───────────────────────────

function Description({
  problem,
  rubricChecks,
  setRubricChecks,
}: {
  problem: Problem;
  rubricChecks: boolean[];
  setRubricChecks: React.Dispatch<React.SetStateAction<boolean[]>>;
}) {
  return (
    <div className="p-7 space-y-6">
      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
        {problem.description}
      </p>

      <Section title="Functional requirements" icon={<CheckCircle2 className="w-4 h-4" />}>
        <ul className="space-y-2 text-sm text-slate-300">
          {problem.requirements.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent mt-0.5">▸</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>

      {problem.bonus && (
        <Section title="Bonus / stretch" icon={<Sparkles className="w-4 h-4" />}>
          <ul className="space-y-2 text-sm text-slate-400">
            {problem.bonus.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent-pink mt-0.5">★</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Concepts you'll train" icon={<Trophy className="w-4 h-4" />}>
        <div className="flex flex-wrap gap-2">
          {problem.concepts.map((c) => (
            <span key={c} className="chip bg-bg-elev border border-bg-border text-slate-300">
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Judging
        problem={problem}
        rubricChecks={rubricChecks}
        setRubricChecks={setRubricChecks}
      />

      <Hints hints={problem.hints} uml={problem.uml} />
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Judging({
  problem,
  rubricChecks,
  setRubricChecks,
}: {
  problem: Problem;
  rubricChecks: boolean[];
  setRubricChecks: React.Dispatch<React.SetStateAction<boolean[]>>;
}) {
  if (problem.tests) {
    return (
      <div className="card p-5 border-accent/30 bg-gradient-to-br from-accent-glow/5 to-transparent">
        <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold mb-3">
          <Wand2 className="w-4 h-4" />
          How this is judged · Auto-graded
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          Submit compiles + runs a hidden test suite against your code. Stars are awarded
          when every assertion passes. The AI grader then reviews your design quality.
        </p>
        <ul className="space-y-2 text-sm text-slate-300">
          {problem.tests.contract.map((c, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent mt-0.5">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (!problem.rubric) return null;
  const total = problem.rubric.length;
  const done = rubricChecks.filter(Boolean).length;
  return (
    <div className="card p-5 border-amber-400/30 bg-gradient-to-br from-amber-400/5 to-transparent">
      <h2 className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 font-semibold mb-1">
        <ClipboardList className="w-4 h-4" />
        How this is judged · Design rubric
      </h2>
      <p className="text-xs text-slate-400 mb-3">
        Open-ended design. Confirm each item below (honor system), then Submit will
        compile + run your code and call the AI grader for an objective review.{' '}
        <span className="text-amber-200/80 font-medium">{done}/{total} confirmed</span>
      </p>
      <ul className="space-y-2">
        {problem.rubric.map((r, i) => (
          <li key={i}>
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={rubricChecks[i] ?? false}
                onChange={() =>
                  setRubricChecks((prev) => {
                    const next = [...prev];
                    next[i] = !next[i];
                    return next;
                  })
                }
                className="mt-0.5 w-4 h-4 rounded border-bg-border bg-bg-elev text-accent focus:ring-accent/40 focus:ring-2 cursor-pointer"
              />
              <span
                className={[
                  'text-sm leading-snug transition-colors',
                  rubricChecks[i] ? 'text-slate-300 line-through' : 'text-slate-200',
                ].join(' ')}
              >
                <RubricInline text={r} />
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RubricInline({ text }: { text: string }) {
  // Render `code` segments in mono font
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') ? (
          <code
            key={i}
            className="font-mono text-[12px] px-1 py-0.5 rounded bg-bg-elev text-accent border border-bg-border"
          >
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Hints({ hints, uml }: { hints: string[]; uml?: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <Section title="Hints" icon={<ChevronDown className="w-4 h-4" />}>
      <ul className="space-y-2">
        {uml && (
          <li className="card overflow-hidden border-accent/30 bg-gradient-to-br from-accent-glow/5 to-transparent">
            <button
              onClick={() => setOpen((o) => ({ ...o, uml: !o.uml }))}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-bg-elev/60 transition-colors"
            >
              <span className="text-sm text-accent font-medium flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> UML class diagram
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold ml-1">
                  spoiler
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  open.uml ? 'rotate-180' : ''
                }`}
              />
            </button>
            {open.uml && (
              <div className="px-4 pb-4 border-t border-bg-border bg-bg-elev/30">
                <MermaidDiagram source={uml} idStem="hint-uml" />
              </div>
            )}
          </li>
        )}
        {hints.map((h, i) => (
          <li key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-bg-elev/60 transition-colors"
            >
              <span className="text-sm text-slate-300">Hint #{i + 1}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  open[i] ? 'rotate-180' : ''
                }`}
              />
            </button>
            {open[i] && (
              <div className="px-4 pb-3 text-sm text-slate-400 border-t border-bg-border bg-bg-elev/30 leading-relaxed">
                <RubricInline text={h} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ───────────────────────────── Editor pane ────────────────────────────────

function EditorPane({
  code,
  onChange,
  running,
  onRun,
  onSubmit,
  onReset,
  alreadySolved,
  output,
  testSummary,
  submitFeedback,
  onOpenReport,
  hasReport,
}: {
  code: string;
  onChange: (next: string) => void;
  running: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  alreadySolved: boolean;
  output: RunResult | null;
  testSummary: TestSummary | null;
  submitFeedback: { ok: boolean; msg: string } | null;
  onOpenReport: () => void;
  hasReport: boolean;
}) {
  const consoleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (output && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <Toolbar
        running={running}
        onRun={onRun}
        onSubmit={onSubmit}
        onReset={onReset}
        alreadySolved={alreadySolved}
        hasReport={hasReport}
        onOpenReport={onOpenReport}
      />
      <Split
        id="editor-console"
        direction="vertical"
        defaultRatio={0.62}
        first={
          <div className="h-full min-h-0">
            <CodeEditor value={code} onChange={onChange} />
          </div>
        }
        second={
          <OutputPanel
            ref={consoleRef}
            output={output}
            running={running}
            feedback={submitFeedback}
            testSummary={testSummary}
          />
        }
        className="flex-1 min-h-0"
      />
    </div>
  );
}

function Toolbar({
  running,
  onRun,
  onSubmit,
  onReset,
  alreadySolved,
  hasReport,
  onOpenReport,
}: {
  running: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  alreadySolved: boolean;
  hasReport: boolean;
  onOpenReport: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-bg-border bg-bg-surface/50">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        Main.java · Java 26 · local JDK
      </div>
      <div className="flex items-center gap-2">
        {hasReport && (
          <button onClick={onOpenReport} className="btn-ghost px-3 py-1.5" disabled={running}>
            <Wand2 className="w-3.5 h-3.5" />
            View report
          </button>
        )}
        <button onClick={onReset} className="btn-ghost px-3 py-1.5" disabled={running}>
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button onClick={onRun} className="btn-ghost px-3 py-1.5" disabled={running}>
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run
        </button>
        <button
          onClick={onSubmit}
          className={alreadySolved ? 'btn-primary' : 'btn-success'}
          disabled={running}
        >
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trophy className="w-3.5 h-3.5" />
          )}
          {alreadySolved ? 'Resubmit' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

interface OutputPanelProps {
  output: RunResult | null;
  running: boolean;
  feedback: { ok: boolean; msg: string } | null;
  testSummary: TestSummary | null;
}

const OutputPanel = forwardRef<HTMLDivElement, OutputPanelProps>(
  ({ output, running, feedback, testSummary }, ref) => {
    const tab = useMemo(() => {
      if (output?.compileError) return 'compile';
      if (output?.stderr) return 'stderr';
      return 'stdout';
    }, [output]);

    return (
      <div className="h-full flex flex-col bg-bg/80 backdrop-blur min-h-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-bg-border">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Terminal className="w-3.5 h-3.5" />
            Console
            {output && (
              <span className="text-slate-600">
                · {output.durationMs.toFixed(0)}ms · exit {output.exitCode ?? '–'}
                {output.ranTests && ' · tests'}
              </span>
            )}
            {testSummary && (
              <span
                className={[
                  'chip text-[10px] ml-2',
                  testSummary.fail === 0
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
                ].join(' ')}
              >
                {testSummary.pass}/{testSummary.pass + testSummary.fail} tests
              </span>
            )}
          </div>
          {feedback && (
            <div
              className={[
                'text-xs flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md',
                feedback.ok
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300',
              ].join(' ')}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {feedback.msg}
            </div>
          )}
        </div>
        <div ref={ref} className="flex-1 overflow-auto p-4 font-mono text-[12.5px] leading-relaxed min-h-0">
          {running && !output && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling & running on your local JVM…
            </div>
          )}
          {!running && !output && (
            <div className="text-slate-600">
              Hit <span className="text-slate-400">Run</span> to compile and execute. Hit{' '}
              <span className="text-emerald-400">Submit</span> to claim stars & get an AI
              design review.
            </div>
          )}
          {output && tab === 'compile' && (
            <pre className="text-rose-300 whitespace-pre-wrap">{output.compileError}</pre>
          )}
          {output && tab === 'stderr' && (
            <>
              {output.stdout && (
                <pre className="text-slate-300 whitespace-pre-wrap mb-3">{output.stdout}</pre>
              )}
              <pre className="text-rose-300 whitespace-pre-wrap">{output.stderr}</pre>
            </>
          )}
          {output && tab === 'stdout' && (
            <pre className="text-slate-200 whitespace-pre-wrap">
              {colorizeTestOutput(output.stdout) || (
                <span className="text-slate-600">(no output)</span>
              )}
            </pre>
          )}
        </div>
      </div>
    );
  },
);
OutputPanel.displayName = 'OutputPanel';

function colorizeTestOutput(s: string): React.ReactNode {
  if (!s) return null;
  const lines = s.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('[PASS]')) {
      return (
        <div key={i} className="text-emerald-300">
          {line}
        </div>
      );
    }
    if (line.startsWith('[FAIL]')) {
      return (
        <div key={i} className="text-rose-300">
          {line}
        </div>
      );
    }
    if (line.startsWith('Result:')) {
      return (
        <div key={i} className="mt-2 font-semibold text-white">
          {line}
        </div>
      );
    }
    return <div key={i}>{line}</div>;
  });
}

