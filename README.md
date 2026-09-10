# LLD Arena

A practice platform for **Low-Level Design** interview problems, built in Java.

32 hand-picked LLD problems · in-browser Monaco editor · your local JDK as the
compiler · star/rank progression · hidden test cases · AI-graded design reports
with a score chart · UML class diagrams per problem.

> Built because the existing LLD prep sites are either paywalled, ugly, or
> don't let you actually _run_ Java. This one fixes all three.

---

## Features

|                        |                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **32 LLD problems**    | Parking Lot · Vending Machine · Snake & Ladder · Tic Tac Toe · LRU Cache · Logger · Pub/Sub · Elevator · ATM · Splitwise · Library · BookMyShow · Rate Limiter · Notifications · Meeting Scheduler · Food Delivery · Uber · Amazon · Restaurant · In-Memory FS · Chess · StackOverflow · Twitter · Airbnb · Distributed Cache · Stock Exchange · Google Calendar · WhatsApp · YouTube · Concurrent HashMap · URL Shortener · TrueCaller |
| **Real Java compiler** | Your local `javac` + `java` run through a tiny Vite middleware. No remote API, no rate limit, no key needed.                                                                                                                                                                                                                                                                                                                            |
| **Hidden test cases**  | 5 problems ship with `Tests.java` that asserts your `Main.java`. Submit shows `[PASS]/[FAIL]` per case.                                                                                                                                                                                                                                                                                                                                 |
| **Design rubric**      | The other 27 open-ended problems show a checklist of design checks you confirm before stars are awarded.                                                                                                                                                                                                                                                                                                                                |
| **AI design grader**   | Optional. Reviews your code against the rubric, returns a 0-100 score, per-criterion breakdown, strengths, improvements, and detected design patterns.                                                                                                                                                                                                                                                                                  |
| **Score chart**        | Animated donut + per-rubric bars (leetcode-style breakdown).                                                                                                                                                                                                                                                                                                                                                                            |
| **UML class diagrams** | Every problem ships with a Mermaid class diagram you can reveal as a spoiler.                                                                                                                                                                                                                                                                                                                                                           |
| **Star / rank system** | Easy = 2★, Medium = 5★, Hard = 10★. Climb from Novice → Apprentice → Architect → Specialist → Expert → Master → **Grandmaster** → Legend.                                                                                                                                                                                                                                                                                               |
| **Resizable panes**    | Drag the dividers between description ↔ editor and editor ↔ console. Double-click to reset. Layout persists per problem.                                                                                                                                                                                                                                                                                                                |
| **Local storage**      | Progress, code drafts, and pane sizes all live in `localStorage`. Reset anytime from the sidebar (type-to-confirm).                                                                                                                                                                                                                                                                                                                     |

---

## Quickstart

### Prerequisites

- **Node.js 18+** (`brew install node` or [nodejs.org](https://nodejs.org))
- **JDK 17+** (anything modern; tested on JDK 26)
  ```bash
  brew install openjdk
  # then ensure `javac` and `java` are on your PATH
  ```

### Install

```bash
git clone [https://github.com/HeyyAbishek/lld-practice-platform.git](https://github.com/HeyyAbishek/lld-practice-platform.git)
cd lld-arena
npm install
```

### Run

```bash
npm run dev
```

Opens `http://localhost:5173`. Pick a problem, write Java, hit **Run** to compile + execute on your local JVM, hit **Submit** to claim stars.

### Build for production

```bash
npm run build
npm run preview
```

---

## Optional: AI design grader

The platform can call [Groq](https://console.groq.com) (free tier) to grade your design against each rubric item.

1. Get a free API key from <https://console.groq.com/keys>
2. Create `.env.local` in the project root:
   ```env
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart `npm run dev`

The key is read **server-side only** by `server/run-java.mjs` and never sent to the browser. The frontend only talks to `/api/grade`.

If you skip this step, everything else still works — Submit still runs your code and awards stars; the design report just won't appear.

---

## How submission is judged

```
                      ┌─────────────────────────────┐
                      │  You hit Submit             │
                      └────────────┬────────────────┘
                                   ▼
                  ┌────────────────────────────────────┐
                  │  Compile + run on local JDK        │
                  │  (if problem has hidden tests,     │
                  │   Tests.java runs against yours)   │
                  └────────────┬───────────────────────┘
                               ▼
                  ┌─────────────────────────┐
        no  ◄─────│  Build clean? Tests OK? │─────► yes
                  └─────────────────────────┘
                                              ▼
                                ┌────────────────────────┐
                                │  Rubric checklist all  │
                                │  ticked? (open-ended   │
                                │  problems only)        │
                                └────────────┬───────────┘
                                              ▼
                                ┌────────────────────────┐
                                │  Award stars           │
                                │  Call Groq for design  │
                                │  review → score chart  │
                                └────────────────────────┘
```

- **Auto-graded problems** (LRU, Tic Tac Toe, Pub/Sub, Rate Limiter, URL Shortener) — stars require every hidden assertion to pass.
- **Rubric problems** (the rest) — stars require every design check ticked **AND** a clean build.

---

## Project layout

```
lld-arena/
├── index.html
├── package.json
├── vite.config.ts            ← registers the Java + Groq middleware plugin
├── server/
│   └── run-java.mjs          ← spawns javac/java, proxies Groq, no client bundle
├── scripts/
│   ├── inject-rubrics.mjs    ← one-shot scripts that authored the dataset
│   └── inject-umls.mjs
├── src/
│   ├── data/problems.ts      ← all 32 problems + starters + tests + rubrics + UMLs
│   ├── lib/
│   │   ├── ranks.ts          ← star tiers, rank computation
│   │   └── runJava.ts        ← /api/run-java + /api/grade clients
│   ├── hooks/useProgress.ts  ← localStorage-backed progress hook
│   └── components/
│       ├── Sidebar.tsx
│       ├── Dashboard.tsx
│       ├── ProblemListPage.tsx
│       ├── ProblemDetailPage.tsx
│       ├── CodeEditor.tsx         (Monaco wrapped with a custom dark theme)
│       ├── MermaidDiagram.tsx
│       ├── ScoreChart.tsx         (leetcode-style score modal)
│       ├── Split.tsx              (drag-to-resize split layout)
│       └── RankBadge.tsx
```

---

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **Tailwind CSS 3** for styling
- **Monaco Editor** (VS Code's editor in the browser) for the code pane
- **Mermaid 11** for class diagrams
- **lucide-react** for icons
- Local **JDK 17+** for compilation & execution

No backend service to run. The Vite dev server _is_ the backend — it spawns
`javac`/`java` and proxies Groq.

---

## Adding your own problem

1. Append a new entry to `src/data/problems.ts` with: `id`, `slug`, `title`, `difficulty`, `tags`, `description`, `requirements`, `concepts`, `hints`, `starter`.
2. Optional but recommended:
   - `tests: { contract: [...], body: '...' }` — Java assertions that run against the user's code (`check("name", boolValue)`).
   - `rubric: [...]` — design-quality bullets shown as a checklist on Submit.
   - `uml: \`classDiagram\n...\`` — Mermaid class diagram shown as a spoiler hint.

Hot reload picks it up immediately.

---

## Resetting progress

Sidebar → **Reset all progress** → type `reset` to confirm. Clears:

- Solved problems & accumulated stars
- All code drafts (per-problem autosaves)
- Pane-size preferences

Everything lives in `localStorage` — there's no account, no server-side state to clean up.

---

## License

MIT — do what you want, attribution appreciated.

---

## Author

[HeyyAbishek](https://github.com/HeyyAbishek)
