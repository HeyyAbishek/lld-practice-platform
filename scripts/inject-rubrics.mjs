// One-shot script: inject `rubric: [...]` immediately before the `hints:` field
// for problems that don't yet have one. Idempotent — re-running is a no-op.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/problems.ts', import.meta.url);

/** Rubric per slug. Keep each item concrete and one-line. */
const RUBRICS = {
  logger: [
    '`LogProcessor` chain — each node holds a reference to the next',
    'Each processor decides only its own level filter; lower levels delegate to `next`',
    'Adding a new appender does NOT modify existing processors (OCP)',
    'Logger is a Singleton (private constructor + static `getInstance`)',
    'No hard-coded `System.out` outside the ConsoleProcessor',
  ],
  'elevator-system': [
    '`DispatchStrategy` is an interface; the lot accepts it via DI (Strategy pattern)',
    'Each elevator tracks pending stops as TWO sorted sets (up / down) — not a single list',
    '`step()` advances exactly one floor and prints the path — no big simulate-everything loop',
    'External vs internal requests use the same `Request` abstraction',
    'Idle elevators have an explicit `IDLE` direction, not `null`',
  ],
  atm: [
    '`ATMState` interface with one class per state (Idle / CardInserted / Auth / Txn)',
    '`CashDispenser` is its own class; uses a `DenominationStrategy`',
    'Invalid transitions throw — e.g. `withdraw` from Idle is impossible',
    'Card auth lives in a separate `BankAuthService` (not on the ATM)',
    'Insufficient cash for the requested amount is detected BEFORE dispensing',
  ],
  splitwise: [
    'A `SplitStrategy` interface — Equal / Exact / Percent each in its own class',
    'Balances stored as `Map<User, Map<User, Double>>` (symmetric or signed, one of the two)',
    '`addExpense` validates that the splits sum to the total (within ε)',
    'No floating-point bugs — round to 2 decimals consistently',
    'Showing balances does NOT mutate state',
  ],
  'library-management': [
    '`Book` (catalog entry) is separate from `BookItem` (physical copy)',
    'Loan has issueDate, dueDate, and an optional returnDate',
    'Overdue fine is computed by a `FineStrategy`, not hard-coded in `Loan`',
    'A member cannot exceed their max-loans cap',
    'Search by title/author/ISBN uses an index, not a linear scan over all books',
  ],
  'movie-booking': [
    'Domain split: City → Cinema → Screen → Show → Seat (no circular refs)',
    'Seat hold is timestamped; an expired hold auto-releases',
    'Two concurrent holds on the same seat — exactly one wins (CAS or lock)',
    'Booking is a separate aggregate from Show — never share mutable seat state',
    '`PricingStrategy` interface so weekend / surge pricing is swappable',
  ],
  'notification-system': [
    'A `Channel` interface; Email / SMS / Push are concrete classes',
    'Decorator wraps a notification with formatters (signature, disclaimer) without subclassing',
    '`NotificationService` knows nothing about specific channels (DI / Strategy)',
    'User preferences (which channels they want) live on the user, not the service',
    'Sending failure on one channel does NOT block the others',
  ],
  'meeting-scheduler': [
    'Per-room bookings live in a `TreeMap<Time, Booking>` (sorted)',
    'Overlap check uses `floorEntry` / `ceilingEntry` — O(log n), not O(n)',
    '`findAvailable(duration)` walks rooms and returns the first match (or empty)',
    'Cancellation frees the slot immediately',
    'Booking is rejected if any invitee has a conflict (not just the room)',
  ],
  'food-delivery': [
    'Order state machine is explicit: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED',
    'Invalid state jumps (e.g. PLACED → DELIVERED) throw',
    '`DriverMatchingStrategy` is an interface — nearest, highest-rated, etc.',
    'Cart/Order pricing breakdown: items + tax + delivery fee + surge — all itemized',
    '`Restaurant` owns its menu; the platform does not edit menu items directly',
  ],
  'cab-booking': [
    'Rider, Driver, Ride are distinct aggregates',
    'Drivers bucketed into a grid (or geo-hash) for O(1) neighbour lookup',
    '`MatchingStrategy` + `PricingStrategy` are both pluggable interfaces',
    'Ride has an explicit state machine (REQUESTED → ASSIGNED → STARTED → COMPLETED / CANCELLED)',
    'Surge multiplier is computed from a region\'s supply/demand, not hard-coded',
  ],
  amazon: [
    'Catalog (Product/Variant) lives in its own package/namespace — no cart dependencies',
    '`Cart.add/remove/updateQty` validates against catalog stock',
    '`PaymentStrategy` interface — Card / UPI / Wallet / COD all implement it',
    '`Order` is created from a successful Payment, never from a raw Cart',
    'Order has its own state machine; Cart is throwaway after checkout',
  ],
  'restaurant-management': [
    'Table state machine: FREE → RESERVED → OCCUPIED → CLEANING → FREE',
    '`Order` and `Bill` are separate — one order can have multiple bills (split)',
    'Kitchen receives a `KitchenTicket` derived from the order, not the order itself',
    'Reservation conflicts are detected with interval overlap, not full scan',
    'Payment is its own step — applies to a Bill, not an Order',
  ],
  'file-system': [
    'Composite pattern — `File` and `Directory` both extend abstract `Node`',
    'Operations are recursive on `Directory` (ls, find), not flat lookups',
    '`mkdir -p` style creates intermediate directories',
    'Reading/creating a file under a non-existent parent throws (not silent)',
    'No path string parsing scattered everywhere — one `Path` utility',
  ],
  chess: [
    'Every piece type is its own class; each implements `canMove(board, from, to)`',
    'No giant `switch` on piece type anywhere',
    '`Move` is a value object — supports `undo` (Command pattern)',
    'Check / Checkmate / Stalemate detection is on the `Board`, not on `Game`',
    'Castling, en-passant, and promotion each handled as special-case moves',
  ],
  'stack-overflow': [
    'User reputation is DERIVED from vote events, not stored as a counter',
    '`Question`, `Answer`, `Comment` share a `Post` base (votable + commentable)',
    'Tags are first-class entities, not strings on Question',
    'Search is by tag/text via an index (Map<Tag, Set<Question>>)',
    'Accepted-answer logic lives on Question, not Answer',
  ],
  twitter: [
    '`getNewsFeed(userId)` uses a k-way merge with a min-heap, not collect-and-sort',
    'Per-user tweets are stored as a list ordered by timestamp',
    'Follow set is a `Set<UserId>`, not a list',
    'Feed is read-time computed (fan-out on read), or write-time (fan-out on write) — pick ONE and document it',
    'Unfollowing removes the user from the follow set, not just marks them inactive',
  ],
  airbnb: [
    'Listing bookings indexed by date for O(log n) overlap check',
    'Booking creation rejects overlapping date ranges atomically',
    'Search filters compose — city + dates + guests + price all narrow the result',
    '`PricingStrategy` separate from Listing (weekend, peak, etc.)',
    'Host and Guest are roles on `User`, not different classes',
  ],
  'distributed-cache': [
    'Hash ring stored in a `TreeMap<Long, Node>`; routing uses `ceilingEntry`',
    'Virtual nodes per physical node — minimum 64 to spread load',
    '`addNode`/`removeNode` re-balance ONLY the affected key range',
    'Each node has its own LRU eviction',
    'Routing is read-only — no locks taken on the read path',
  ],
  'stock-exchange': [
    'Buy book is a max-heap by price, sell book is a min-heap by price',
    'Tie-break by timestamp (price-time priority)',
    'Market orders consume the opposite book until filled or empty',
    'Limit orders rest in their side\'s book if not immediately matched',
    'Cancel removes the order regardless of its position in the book',
  ],
  'google-calendar': [
    'Recurring events are NOT materialized — a `RecurrenceRule` generates occurrences on demand',
    'Free-busy across calendars merges intervals, not occurrences one-by-one',
    'Time zone is stored on the event, never assumed UTC',
    'Invitee RSVP state is on the invitee, not on the event',
    'Reminder is a separate aggregate; deleting an event cascades to its reminders',
  ],
  whatsapp: [
    '1-1 and group chats use the same `Chat` abstraction (group with 2 members)',
    'Message states (SENT / DELIVERED / READ) advance per recipient, not per message',
    'Group admin permissions are checked at action sites, not stored as bool flags',
    'Last-seen and typing indicators are events, not properties on User',
    'Mute is per-user-per-chat, not global on the chat',
  ],
  youtube: [
    'Encoding pipeline is a chain of `EncodingStep` objects, swappable in order',
    'Subscription notifications go through the `Observer` interface',
    'Playlists implement Composite — a playlist can contain playlists',
    'Recommendation logic is a `RecommendationStrategy`',
    'View counts are append-only events; counters are derived',
  ],
  'concurrent-hashmap': [
    'Map is striped into ≥ 16 segments — each with its own lock',
    'put/get/remove only lock the relevant stripe, never the whole map',
    'Resize moves keys segment-by-segment, not all at once',
    'No `synchronized` on the public methods — fine-grained locks only',
    'Iterator is weakly consistent (or explicit snapshot), not throw-on-modify',
  ],
  'true-caller': [
    'Prefix search uses a Trie, not a list scan',
    'Reverse lookup (number → contact) uses a HashMap, O(1)',
    'Spam reports are counters per number; cross-threshold flips an `isSpam` flag',
    'Adding/removing contacts updates BOTH indexes consistently',
    'Search results are ranked (spam pushed down, frequent contacts up)',
  ],
};

const src = readFileSync(FILE, 'utf8');
let out = src;
let touched = 0;
let skipped = 0;

for (const [slug, rubric] of Object.entries(RUBRICS)) {
  // Anchor: find the slug, then the next `hints:` after it; insert rubric just before hints.
  const slugIdx = out.indexOf(`slug: '${slug}',`);
  if (slugIdx < 0) {
    console.warn(`! slug not found: ${slug}`);
    continue;
  }
  // Find the end of this object's outer block — next standalone `},` line at column 2 after slugIdx
  const blockEnd = out.indexOf('\n  },', slugIdx);
  if (blockEnd < 0) {
    console.warn(`! object end not found for ${slug}`);
    continue;
  }
  const region = out.slice(slugIdx, blockEnd);

  if (region.includes('rubric:')) {
    skipped++;
    continue;
  }

  // Find the `    hints:` line within the region
  const hintsRelative = region.indexOf('    hints:');
  if (hintsRelative < 0) {
    console.warn(`! hints field not found in ${slug}`);
    continue;
  }
  const hintsAbsolute = slugIdx + hintsRelative;

  const rubricBlock =
    `    rubric: [\n` +
    rubric.map((r) => `      ${JSON.stringify(r)},`).join('\n') +
    `\n    ],\n`;

  out = out.slice(0, hintsAbsolute) + rubricBlock + out.slice(hintsAbsolute);
  touched++;
}

writeFileSync(FILE, out, 'utf8');
console.log(`Done. Injected ${touched} rubrics, skipped ${skipped}.`);
