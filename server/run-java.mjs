/**
 * Local Java runner + Groq AI grader used by the Vite middleware.
 *
 * POST /api/run-java
 *   { source, stdin?, tests? } → compiles + runs. If `tests` present, it's
 *   stitched into a sibling Tests.java that calls a `runTests()` body and
 *   prints `[PASS]/[FAIL]` lines.
 *
 * POST /api/grade
 *   { problem, rubric, source } → returns Groq's per-rubric scoring as JSON
 *   suitable for the front-end's leetcode-style score chart. The Groq API
 *   key is read from process.env.GROQ_API_KEY and never leaves the server.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const COMPILE_TIMEOUT_MS = 15_000;
const RUN_TIMEOUT_MS = 8_000;
const MAX_OUTPUT_BYTES = 200_000;

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- env loading -----------------------------------------------------------

let envLoaded = false;
async function loadEnv() {
  if (envLoaded) return;
  envLoaded = true;
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await readFile(join(__dirname, '..', file), 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
        }
      }
    } catch {
      /* file missing — fine */
    }
  }
}

// --- process helpers -------------------------------------------------------

function runProc(cmd, args, { cwd, stdin = '', timeoutMs } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, LANG: 'en_US.UTF-8' },
    });

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= MAX_OUTPUT_BYTES) stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= MAX_OUTPUT_BYTES) stderr += chunk.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        code: null,
        signal: null,
        stdout,
        stderr: stderr + '\n' + err.message,
        timedOut: false,
        spawnError: err,
      });
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (stdoutBytes > MAX_OUTPUT_BYTES)
        stdout += `\n[…truncated, ${stdoutBytes - MAX_OUTPUT_BYTES} more bytes]`;
      if (stderrBytes > MAX_OUTPUT_BYTES)
        stderr += `\n[…truncated, ${stderrBytes - MAX_OUTPUT_BYTES} more bytes]`;
      resolve({ code, signal, stdout, stderr, timedOut });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

// --- Tests.java template ---------------------------------------------------

const TESTS_PRELUDE = `public class Tests {
    static int pass = 0, fail = 0;
    static void check(String name, boolean ok) { check(name, ok, ""); }
    static void check(String name, boolean ok, String detail) {
        if (ok) { pass++; System.out.println("[PASS] " + name); }
        else    { fail++; System.out.println("[FAIL] " + name + (detail.isEmpty() ? "" : " — " + detail)); }
    }
    public static void main(String[] args) {
        try {
            runTests();
        } catch (Throwable t) {
            fail++;
            System.out.println("[FAIL] uncaught exception — " + t.getClass().getSimpleName() + ": " + t.getMessage());
            t.printStackTrace(System.out);
        }
        System.out.println();
        System.out.println("Result: " + pass + " passed, " + fail + " failed");
        if (fail > 0) System.exit(1);
    }
    static void runTests() throws Exception {
__TEST_BODY__
    }
}
`;

function makeTestsSource(body) {
  // Indent the body so it sits inside the runTests() method
  const indented = body
    .split('\n')
    .map((l) => (l.length ? '        ' + l : l))
    .join('\n');
  return TESTS_PRELUDE.replace('__TEST_BODY__', indented);
}

// --- Java exec -------------------------------------------------------------

export async function runJava({ source, stdin = '', tests = null }) {
  const t0 = Date.now();
  const work = await mkdtemp(join(tmpdir(), 'lld-arena-'));
  try {
    await writeFile(join(work, 'Main.java'), source, 'utf8');
    const sources = ['Main.java'];

    if (tests && typeof tests === 'string') {
      await writeFile(join(work, 'Tests.java'), makeTestsSource(tests), 'utf8');
      sources.push('Tests.java');
    }

    const compile = await runProc('javac', sources, {
      cwd: work,
      timeoutMs: COMPILE_TIMEOUT_MS,
    });

    if (compile.spawnError) {
      return {
        stdout: '',
        stderr: '',
        compileError:
          'Java toolchain not found. Install a JDK (e.g. `brew install openjdk`) and restart the dev server.',
        exitCode: null,
        durationMs: Date.now() - t0,
        ok: false,
        ranTests: !!tests,
      };
    }

    if (compile.code !== 0) {
      return {
        stdout: '',
        stderr: '',
        compileError: compile.stderr || compile.stdout || 'Compilation failed.',
        exitCode: compile.code,
        durationMs: Date.now() - t0,
        ok: false,
        ranTests: !!tests,
      };
    }

    const mainClass = tests ? 'Tests' : 'Main';
    const run = await runProc('java', ['-cp', '.', mainClass], {
      cwd: work,
      stdin,
      timeoutMs: RUN_TIMEOUT_MS,
    });

    let stderr = run.stderr;
    if (run.timedOut) stderr += `\n[killed: exceeded ${RUN_TIMEOUT_MS}ms run timeout]`;

    return {
      stdout: run.stdout,
      stderr,
      compileError: '',
      exitCode: run.code,
      durationMs: Date.now() - t0,
      ok: !run.timedOut && run.code === 0,
      ranTests: !!tests,
    };
  } finally {
    rm(work, { recursive: true, force: true }).catch(() => {});
  }
}

// --- Groq grader -----------------------------------------------------------

async function gradeWithGroq({ problem, rubric, source }) {
  await loadEnv();
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return {
      error:
        'GROQ_API_KEY is not configured on the server. Set it in .env.local and restart.',
    };
  }

  const trimmedSource = source.length > 12_000 ? source.slice(0, 12_000) + '\n// …truncated' : source;
  const system = `You are an expert Java + LLD (low-level design) interviewer grading a candidate's solution.
Your job: for each rubric item, decide whether the candidate's code clearly demonstrates that property.
Be strict but fair — if the code does not contain the relevant abstraction at all, score it 0.
If the abstraction is present but incomplete, score it partially (1–3).
If clean and idiomatic, 4. If textbook-quality, 5.

You MUST respond with valid JSON ONLY, matching this exact schema:
{
  "overall": <integer 0..100, your overall design-quality score>,
  "verdict": "<one short sentence>",
  "rubric_scores": [
    { "criterion": "<exact rubric text>", "score": <integer 0..5>, "comment": "<one-line specific feedback>" }
  ],
  "strengths": ["<short bullet>", "<short bullet>"],
  "improvements": ["<short bullet>", "<short bullet>"],
  "design_patterns_detected": ["<pattern name>", "<pattern name>"]
}

Do not include any prose outside the JSON. No markdown fences.`;

  const user = `# Problem
${problem.title} (${problem.difficulty})

${problem.description}

# Rubric
${rubric.map((r, i) => `${i + 1}. ${r}`).join('\n')}

# Candidate's Java code
\`\`\`java
${trimmedSource}
\`\`\`

Grade the code against each rubric item and return the JSON described in the system prompt.`;

  const body = {
    model: "openai/gpt-oss-20b",
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  };

  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: `Groq unreachable: ${e?.message ?? e}` };
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    return { error: `Groq HTTP ${res.status}: ${txt.slice(0, 400)}` };
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? '';
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { error: 'Groq returned non-JSON content', raw: content.slice(0, 600) };
  }
  return { result: parsed };
}

// --- Vite middleware -------------------------------------------------------

async function readJsonBody(req, max = 400_000) {
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > max) throw new Error('Request body too large');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

export function javaRunnerPlugin() {
  return {
    name: 'lld-arena:java-runner',
    configureServer(server) {
      server.middlewares.use('/api/run-java', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          const body = await readJsonBody(req);
          if (typeof body.source !== 'string' || body.source.length > 200_000) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid source' }));
            return;
          }
          const result = await runJava({
            source: body.source,
            stdin: typeof body.stdin === 'string' ? body.stdin : '',
            tests: typeof body.tests === 'string' ? body.tests : null,
          });
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: err?.message ?? String(err) }));
        }
      });

      server.middlewares.use('/api/grade', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        try {
          const body = await readJsonBody(req);
          if (
            !body.problem ||
            !Array.isArray(body.rubric) ||
            typeof body.source !== 'string'
          ) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid payload' }));
            return;
          }
          const result = await gradeWithGroq(body);
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: err?.message ?? String(err) }));
        }
      });
    },
  };
}
