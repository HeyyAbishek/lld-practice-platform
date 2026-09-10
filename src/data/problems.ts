export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  /** Markdown-ish description (we render with our own mini parser) */
  description: string;
  /** Functional requirements bullets */
  requirements: string[];
  /** Bonus / stretch goals */
  bonus?: string[];
  /** Hints */
  hints: string[];
  /** Starter Java code with TODOs */
  starter: string;
  /** OOP / design-pattern concepts this problem trains */
  concepts: string[];
  /**
   * Hidden auto-tests. If present, Submit compiles + runs them against the
   * user's code. Stars are only awarded when every assertion passes.
   *
   * `body` is the Java code that runs inside `Tests.runTests()`. It can call
   * the helper `check(String name, boolean ok)` / `check(name, ok, detail)`.
   * Reference the user's types as `Main.<TypeName>` (they're nested in Main).
   *
   * `contract` is the human-readable bullet list shown to the user so they
   * know what's being tested.
   */
  tests?: { body: string; contract: string[] };
  /**
   * Design rubric for open-ended problems where auto-grading isn't possible.
   * Shown as a checklist on Submit; the user must tick every item AND the
   * code must compile + run cleanly for stars to be awarded.
   */
  rubric?: string[];
  /**
   * Mermaid class-diagram source. Rendered in the hints panel as an
   * "Architecture sketch" — opening it is opt-in (one extra "hint" entry).
   */
  uml?: string;
}

const wrap = (s: string) => s.replace(/^\n+|\n+$/g, '');

export const PROBLEMS: Problem[] = [
  // ───────────────────── EASY ─────────────────────
  {
    id: 'p01',
    slug: 'parking-lot',
    title: 'Design a Parking Lot',
    difficulty: 'easy',
    tags: ['OOP', 'Strategy', 'Factory'],
    concepts: ['Inheritance', 'Polymorphism', 'Enum', 'Factory pattern'],
    description: wrap(`
Design an object-oriented parking-lot system. The lot has multiple floors, each
floor has multiple spots of different sizes (motorcycle, compact, large). A vehicle
arrives, gets the nearest fitting spot, receives a ticket, and on exit pays a fee
calculated from the duration.

This is the classic "Hello world" of LLD interviews. Focus on clean abstractions —
\`Vehicle\`, \`ParkingSpot\`, \`Ticket\`, \`ParkingLot\` — and a pluggable
\`FeeStrategy\`.
`),
    requirements: [
      'Support 3 vehicle types: Motorcycle, Car, Truck',
      'Support 3 spot sizes: Small, Medium, Large (bigger spot fits smaller vehicle)',
      'park(vehicle) → Ticket  /  unpark(ticket) → fee',
      'Track availability per floor & globally',
      'Throw / return empty if the lot is full',
    ],
    bonus: [
      'Hourly tiered pricing (first hour free, then ₹50/hr)',
      'Multiple entry/exit gates',
      'Reserved spots for EVs',
    ],
    rubric: [
      '`Vehicle` is abstract with subclasses Motorcycle/Car/Truck (no `instanceof` checks anywhere)',
      'Spot fit logic uses an enum/ordinal, not a chain of if-else',
      '`FeeStrategy` is an interface — swapping pricing does not touch `ParkingLot`',
      '`park(vehicle)` is O(log n) or better (use a per-size free pool)',
      'Full lot is handled cleanly (return Optional/empty ticket, no nulls leaking)',
    ],
    uml: `
classDiagram
    class ParkingLot {
      -List~ParkingFloor~ floors
      -FeeStrategy fee
      +park(Vehicle) Ticket
      +unpark(Ticket) double
    }
    class ParkingFloor {
      -Map~SpotSize, Queue~ free
      +findSpot(Vehicle) ParkingSpot
    }
    class ParkingSpot {
      -SpotSize size
      -Vehicle current
      +fits(Vehicle) bool
    }
    class Vehicle {
      <<abstract>>
      +required() SpotSize
    }
    class Motorcycle
    class Car
    class Truck
    class FeeStrategy {
      <<interface>>
      +calc(Ticket) double
    }
    Vehicle <|-- Motorcycle
    Vehicle <|-- Car
    Vehicle <|-- Truck
    ParkingLot *-- ParkingFloor
    ParkingFloor *-- ParkingSpot
    ParkingLot --> FeeStrategy
    ParkingSpot --> Vehicle
`,
    hints: [
      'Start with an abstract `Vehicle` and an enum `SpotSize`. Use polymorphism.',
      'A `FeeStrategy` interface decouples pricing from the lot.',
      '`Map<SpotSize, Queue<ParkingSpot>>` of free spots gives O(1) park.',
    ],
    starter: wrap(`
import java.util.*;

public class Main {
    enum SpotSize { SMALL, MEDIUM, LARGE }
    enum VehicleType { MOTORCYCLE, CAR, TRUCK }

    static abstract class Vehicle {
        final String plate; final VehicleType type;
        Vehicle(String p, VehicleType t) { plate = p; type = t; }
        abstract SpotSize required();
    }
    static class Motorcycle extends Vehicle { Motorcycle(String p){super(p,VehicleType.MOTORCYCLE);} SpotSize required(){return SpotSize.SMALL;} }
    static class Car        extends Vehicle { Car(String p){super(p,VehicleType.CAR);}            SpotSize required(){return SpotSize.MEDIUM;} }
    static class Truck      extends Vehicle { Truck(String p){super(p,VehicleType.TRUCK);}        SpotSize required(){return SpotSize.LARGE;} }

    static class ParkingSpot {
        final int id; final SpotSize size; Vehicle current;
        ParkingSpot(int id, SpotSize s){ this.id=id; this.size=s; }
        boolean fits(Vehicle v){ return current==null && size.ordinal() >= v.required().ordinal(); }
    }

    static class ParkingLot {
        // TODO: store spots, free pools, tickets
        // TODO: implement park / unpark / feeFor
    }

    public static void main(String[] args) {
        // TODO: build a lot, park a couple of vehicles, print tickets and fees
        System.out.println("LLD Arena · Parking Lot");
    }
}
`),
  },
  {
    id: 'p02',
    slug: 'vending-machine',
    title: 'Design a Vending Machine',
    difficulty: 'easy',
    tags: ['State', 'OOP'],
    concepts: ['State pattern', 'Enum', 'Inventory'],
    description: wrap(`
Model a vending machine that accepts coins, lets a user select a product, dispenses
the product, and returns change. The machine moves through states:
**Idle → HasMoney → Dispensing → Idle**.

Implementing the State pattern cleanly is the whole point of this problem.
`),
    requirements: [
      'States: Idle, HasMoney, Dispensing',
      'insertCoin(coin), selectProduct(code), dispense(), refund()',
      'Track inventory per product code',
      'Invalid transitions must throw',
    ],
    bonus: ['Multi-coin denominations + change return', 'Restock API'],
    rubric: [
      '`MachineState` is an interface with one concrete class per state (Idle / HasMoney / Dispensing)',
      'No `switch` on a state enum inside the machine — behavior lives on the state classes',
      'Invalid transitions throw `IllegalStateException` (not silent no-ops)',
      '`VendingMachine` exposes only setState() to its states, hiding internals',
      'Inventory is decremented atomically with the dispense action',
    ],
    uml: `
classDiagram
    class VendingMachine {
      -MachineState state
      -int balance
      -Map~String,Item~ inventory
      +insertCoin(int)
      +select(String)
      +dispense()
      +setState(MachineState)
    }
    class MachineState {
      <<interface>>
      +insertCoin(VendingMachine, int)
      +select(VendingMachine, String)
      +dispense(VendingMachine)
    }
    class IdleState
    class HasMoneyState
    class DispensingState
    MachineState <|.. IdleState
    MachineState <|.. HasMoneyState
    MachineState <|.. DispensingState
    VendingMachine --> MachineState
`,
    hints: [
      'Make `MachineState` an interface; one class per state.',
      'Each state knows which transitions are legal.',
    ],
    starter: wrap(`
public class Main {
    interface MachineState {
        void insertCoin(VendingMachine m, int amount);
        void selectProduct(VendingMachine m, String code);
        void dispense(VendingMachine m);
    }
    static class VendingMachine {
        MachineState state;
        int balance;
        // TODO: inventory map, setState, etc.
    }
    public static void main(String[] args) {
        System.out.println("LLD Arena · Vending Machine");
    }
}
`),
  },
  {
    id: 'p03',
    slug: 'snake-and-ladder',
    title: 'Design Snake & Ladder',
    difficulty: 'easy',
    tags: ['OOP', 'Game'],
    concepts: ['Composition', 'Queue', 'Random'],
    description: wrap(`
Two or more players, a 10×10 board with snakes and ladders, take turns rolling a
6-sided die. First to square 100 wins. Build the game so adding/removing snakes,
ladders, or players is trivial.
`),
    requirements: [
      'Configurable board size & snake/ladder positions',
      '2+ players take turns',
      'Print every move and the winner',
      'Roll exactly 100 to win (extra = bounce back)',
    ],
    rubric: [
      '`Jump` is a single class (start → end) used for both snakes and ladders',
      'Players rotate via a `Queue<Player>` — no manual index math',
      '`Dice` is its own class so it can be replaced with a deterministic one in tests',
      'Bouncing back past 100 is implemented (not just `>=` win)',
      'Adding a new snake or ladder is a one-line `board.addJump(start, end)`',
    ],
    uml: `
classDiagram
    class Game {
      -Board board
      -Queue~Player~ players
      -Dice dice
      +play()
    }
    class Board {
      -int size
      -Map~int,Jump~ jumps
      +nextPosition(int, int) int
    }
    class Jump {
      +int start
      +int end
    }
    class Player { +String name; +int pos }
    class Dice { +roll() int }
    Game *-- Board
    Game *-- Dice
    Game o-- Player
    Board *-- Jump
`,
    hints: [
      'A `Jump` (head→tail) object is cleaner than two parallel maps.',
      'Use a `Queue<Player>` so the turn rotation is one line.',
    ],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Jump { int start, end; Jump(int s, int e){start=s;end=e;} }
    static class Player { String name; int pos; Player(String n){name=n;} }
    static class Game {
        int size; Map<Integer, Jump> jumps = new HashMap<>();
        Queue<Player> players = new ArrayDeque<>();
        // TODO: play() loop, roll(), move()
    }
    public static void main(String[] args) {
        System.out.println("LLD Arena · Snake & Ladder");
    }
}
`),
  },
  {
    id: 'p04',
    slug: 'tic-tac-toe',
    title: 'Design Tic Tac Toe',
    difficulty: 'easy',
    tags: ['OOP', 'Game'],
    concepts: ['Composition', 'State'],
    description: wrap(`
Two players, 3×3 board, X and O, classic win conditions. The implementation must
generalize to N×N (Gomoku / k-in-a-row).
`),
    requirements: [
      'N×N board (default 3)',
      'Detect win on a row / column / both diagonals in O(1) per move',
      'Detect draw',
    ],
    uml: `
classDiagram
    class TicTacToe {
      -int n
      -int[] rows
      -int[] cols
      -int diag
      -int anti
      +move(int, int, int) int
    }
    note for TicTacToe "O(1) per move via running counters"
`,
    hints: [
      'Keep running counters per row, per col, and per diagonal.',
      "Increment by +1 for X, -1 for O; |sum| == n is a win.",
    ],
    starter: wrap(`
public class Main {
    static class TicTacToe {
        int n; int[] rows, cols; int diag, anti;
        TicTacToe(int n){ this.n=n; rows=new int[n]; cols=new int[n]; }
        // Returns 0 if no winner yet, otherwise the winning player (1 or 2).
        public int move(int r, int c, int player) {
            // TODO: implement O(1) win detection per move
            return 0;
        }
    }
    public static void main(String[] args) {
        System.out.println("LLD Arena · Tic Tac Toe");
    }
}
`),
    tests: {
      contract: [
        '`new Main.TicTacToe(n)` constructs an n×n board',
        '`move(row, col, player)` returns 0 when no winner yet',
        'Returns the player number (1 or 2) on the winning move',
        'Detects wins on rows, columns, and both diagonals',
      ],
      body: wrap(`
// Row win for player 1
Main.TicTacToe g1 = new Main.TicTacToe(3);
check("empty board no winner", g1.move(0,0,1) == 0);
check("p2 first", g1.move(1,1,2) == 0);
check("p1 again", g1.move(0,1,1) == 0);
check("p2 again", g1.move(2,2,2) == 0);
check("row win returns 1", g1.move(0,2,1) == 1);

// Column win for player 2
Main.TicTacToe g2 = new Main.TicTacToe(3);
g2.move(0,0,1); g2.move(0,1,2);
g2.move(1,0,1); g2.move(1,1,2);
g2.move(2,2,1);
check("column win returns 2", g2.move(2,1,2) == 2);

// Diagonal win
Main.TicTacToe g3 = new Main.TicTacToe(3);
g3.move(0,0,1); g3.move(0,1,2);
g3.move(1,1,1); g3.move(0,2,2);
check("diagonal win returns 1", g3.move(2,2,1) == 1);

// Anti-diagonal
Main.TicTacToe g4 = new Main.TicTacToe(3);
g4.move(0,2,1); g4.move(0,0,2);
g4.move(1,1,1); g4.move(1,0,2);
check("anti-diag win returns 1", g4.move(2,0,1) == 1);
`),
    },
  },
  {
    id: 'p05',
    slug: 'lru-cache',
    title: 'Design an LRU Cache',
    difficulty: 'easy',
    tags: ['Data Structures'],
    concepts: ['Doubly linked list', 'HashMap', 'Generic class'],
    description: wrap(`
Implement an LRU cache with O(1) get and put. When capacity is exceeded, evict the
least-recently-used key. Generic over K and V.
`),
    requirements: ['get(k) → V or null in O(1)', 'put(k,v) in O(1)', 'Evict LRU on overflow'],
    bonus: ['Make it thread-safe', 'Add TTL per entry'],
    uml: `
classDiagram
    class LRU~K,V~ {
      -int capacity
      -Map~K,Node~ index
      -Node head
      -Node tail
      +get(K) V
      +put(K, V)
      -touch(Node)
      -evict()
    }
    class Node~K,V~ {
      +K key
      +V value
      +Node prev
      +Node next
    }
    LRU *-- Node
`,
    hints: [
      'Doubly linked list + HashMap<K, Node>.',
      'Move-to-front on touch.',
    ],
    starter: wrap(`
import java.util.*;
public class Main {
    static class LRU<K,V> {
        // TODO: implement
        public LRU(int capacity){}
        public V get(K k){ return null; }
        public void put(K k, V v){}
    }
    public static void main(String[] args) {
        LRU<Integer,String> c = new LRU<>(2);
        c.put(1,"a"); c.put(2,"b");
        System.out.println(c.get(1)); // a
        c.put(3,"c");                  // evicts 2
        System.out.println(c.get(2)); // null
    }
}
`),
    tests: {
      contract: [
        '`new Main.LRU<Integer,String>(capacity)` works',
        '`get(key)` returns the stored value (or null if absent)',
        'After capacity is exceeded, the least-recently-used key is evicted',
        'A `get` counts as a use — that key should NOT be the next to evict',
      ],
      body: wrap(`
Main.LRU<Integer,String> c = new Main.LRU<>(2);
c.put(1, "a");
c.put(2, "b");
check("get existing key", "a".equals(c.get(1)));
c.put(3, "c"); // should evict key 2 (least recently used)
check("LRU eviction kicks in", c.get(2) == null);
check("recently used key kept", "a".equals(c.get(1)));
c.put(4, "d"); // should evict 3 now (1 was just touched)
check("touched key survived second wave", "a".equals(c.get(1)));
check("oldest of remaining was evicted", c.get(3) == null);
check("new key present", "d".equals(c.get(4)));
`),
    },
  },
  {
    id: 'p06',
    slug: 'logger',
    title: 'Design a Logging Framework',
    difficulty: 'easy',
    tags: ['Chain of Responsibility', 'Singleton'],
    concepts: ['Chain of Responsibility', 'Levels', 'Multiple appenders'],
    description: wrap(`
Design a logging framework (log4j-lite). Loggers have a level (DEBUG < INFO <
WARN < ERROR < FATAL). A log call only fires appenders that pass the level filter.
Appenders: Console, File (string buffer). Use Chain of Responsibility.
`),
    requirements: [
      'Levels: DEBUG, INFO, WARN, ERROR, FATAL',
      'Multiple appenders chained',
      'logger.info("hello") routes through the chain',
    ],
    rubric: [
      "`LogProcessor` chain — each node holds a reference to the next",
      "Each processor decides only its own level filter; lower levels delegate to `next`",
      "Adding a new appender does NOT modify existing processors (OCP)",
      "Logger is a Singleton (private constructor + static `getInstance`)",
      "No hard-coded `System.out` outside the ConsoleProcessor",
    ],
    uml: `
classDiagram
    class Logger {
      <<singleton>>
      -LogProcessor chain
      +log(Level, String)
    }
    class LogProcessor {
      <<abstract>>
      -LogProcessor next
      +log(Level, String)
    }
    class DebugProcessor
    class InfoProcessor
    class ErrorProcessor
    LogProcessor <|-- DebugProcessor
    LogProcessor <|-- InfoProcessor
    LogProcessor <|-- ErrorProcessor
    Logger --> LogProcessor
    LogProcessor --> LogProcessor : next
`,
    hints: ['Each `LogProcessor` has a `next` and a minimum level it cares about.'],
    starter: wrap(`
public class Main {
    enum Level { DEBUG, INFO, WARN, ERROR, FATAL }
    static abstract class LogProcessor {
        LogProcessor next;
        LogProcessor(LogProcessor n){ next = n; }
        void log(Level l, String msg){ if(next!=null) next.log(l,msg); }
    }
    // TODO: ConsoleLogProcessor, ErrorLogProcessor, etc.
    public static void main(String[] args) {
        System.out.println("LLD Arena · Logger");
    }
}
`),
  },
  {
    id: 'p07',
    slug: 'pub-sub',
    title: 'Design a Pub/Sub System',
    difficulty: 'easy',
    tags: ['Observer'],
    concepts: ['Observer pattern', 'Topics', 'Threading basics'],
    description: wrap(`
Classic Observer pattern. Publishers post messages on a topic, subscribers receive
every new message for topics they subscribed to.
`),
    requirements: [
      'subscribe(topic, subscriber)',
      'publish(topic, message) → all subscribers receive message',
      'unsubscribe(topic, subscriber)',
    ],
    uml: `
classDiagram
    class Broker {
      -Map~String,List~Subscriber~~ topics
      +subscribe(String, Subscriber)
      +unsubscribe(String, Subscriber)
      +publish(String, String)
    }
    class Subscriber {
      <<interface>>
      +onMessage(String, String)
    }
    Broker o-- Subscriber
`,
    hints: ['`Map<String, List<Subscriber>>` is enough for the synchronous version.'],
    starter: wrap(`
import java.util.*;
public class Main {
    interface Subscriber { void onMessage(String topic, String msg); }
    static class Broker {
        public void subscribe(String topic, Subscriber s) {
            // TODO
        }
        public void unsubscribe(String topic, Subscriber s) {
            // TODO
        }
        public void publish(String topic, String msg) {
            // TODO
        }
    }
    public static void main(String[] args) {
        System.out.println("LLD Arena · Pub/Sub");
    }
}
`),
    tests: {
      contract: [
        '`Broker.subscribe(topic, subscriber)` registers a subscriber',
        '`publish(topic, msg)` delivers `msg` to every subscriber of that topic',
        'Subscribers on OTHER topics do not receive the message',
        '`unsubscribe(topic, subscriber)` stops further deliveries',
      ],
      body: wrap(`
Main.Broker b = new Main.Broker();
java.util.List<String> got = new java.util.ArrayList<>();
Main.Subscriber sub = (t, m) -> got.add(t + ":" + m);
b.subscribe("news", sub);
b.publish("news", "hello");
b.publish("news", "world");
b.publish("sports", "ignored");
check("subscriber received both news msgs", got.size() == 2, "got " + got);
check("topic isolation", !got.toString().contains("ignored"));
check("messages in order",
    got.size() == 2 && got.get(0).equals("news:hello") && got.get(1).equals("news:world"));
b.unsubscribe("news", sub);
b.publish("news", "after-unsub");
check("no delivery after unsubscribe", got.size() == 2, "got " + got.size() + " messages");
`),
    },
  },

  // ───────────────────── MEDIUM ─────────────────────
  {
    id: 'p08',
    slug: 'elevator-system',
    title: 'Design an Elevator System',
    difficulty: 'medium',
    tags: ['Scheduler', 'Strategy'],
    concepts: ['Strategy pattern', 'Priority queue', 'Concurrency mental model'],
    description: wrap(`
A building has N floors and M elevators. People press external buttons (up/down on
a floor) and internal buttons (destination inside the cabin). A *dispatcher* picks
which elevator answers a hall call. Elevators move floor-by-floor.

The dispatch strategy must be pluggable — Nearest-Car, SCAN/LOOK, etc.
`),
    requirements: [
      'External requests have a floor + direction',
      'Internal requests have a destination floor',
      'Pluggable `DispatchStrategy`',
      'Print the elevator path / state per tick',
    ],
    rubric: [
      "`DispatchStrategy` is an interface; the lot accepts it via DI (Strategy pattern)",
      "Each elevator tracks pending stops as TWO sorted sets (up / down) — not a single list",
      "`step()` advances exactly one floor and prints the path — no big simulate-everything loop",
      "External vs internal requests use the same `Request` abstraction",
      "Idle elevators have an explicit `IDLE` direction, not `null`",
    ],
    uml: `
classDiagram
    class ElevatorSystem {
      -List~Elevator~ elevators
      -DispatchStrategy dispatcher
      +request(int, Direction)
      +tick()
    }
    class Elevator {
      -int floor
      -Direction dir
      -TreeSet~int~ up
      -TreeSet~int~ down
      +addStop(int)
      +step()
    }
    class DispatchStrategy {
      <<interface>>
      +pick(List~Elevator~, int, Direction) Elevator
    }
    class NearestCar
    class ScanStrategy
    DispatchStrategy <|.. NearestCar
    DispatchStrategy <|.. ScanStrategy
    ElevatorSystem *-- Elevator
    ElevatorSystem --> DispatchStrategy
`,
    hints: [
      'Each `Elevator` has a sorted set of pending stops in the direction of travel.',
      'Dispatcher picks elevator with smallest cost (distance + same-direction bonus).',
    ],
    starter: wrap(`
import java.util.*;
public class Main {
    enum Direction { UP, DOWN, IDLE }
    static class Elevator {
        int id, floor = 0;
        Direction dir = Direction.IDLE;
        TreeSet<Integer> up = new TreeSet<>(), down = new TreeSet<>(Comparator.reverseOrder());
        // TODO: step(), addStop()
    }
    interface DispatchStrategy { Elevator pick(List<Elevator> es, int floor, Direction d); }
    public static void main(String[] args){ System.out.println("LLD Arena · Elevator"); }
}
`),
  },
  {
    id: 'p09',
    slug: 'atm',
    title: 'Design an ATM',
    difficulty: 'medium',
    tags: ['State', 'OOP'],
    concepts: ['State pattern', 'Transaction objects', 'Cash denomination'],
    description: wrap(`
An ATM authenticates a card + PIN, lets the user check balance, withdraw, or
deposit, and dispenses cash from available denominations. Model the state machine
**Idle → CardInserted → Authenticated → Transaction → CashDispensed → Idle**.
`),
    requirements: [
      'States as above',
      'Withdraw uses denomination strategy (largest-bill-first by default)',
      'Reject if insufficient cash overall or for the requested amount',
    ],
    rubric: [
      "`ATMState` interface with one class per state (Idle / CardInserted / Auth / Txn)",
      "`CashDispenser` is its own class; uses a `DenominationStrategy`",
      "Invalid transitions throw — e.g. `withdraw` from Idle is impossible",
      "Card auth lives in a separate `BankAuthService` (not on the ATM)",
      "Insufficient cash for the requested amount is detected BEFORE dispensing",
    ],
    uml: `
classDiagram
    class ATM {
      -ATMState state
      -CashDispenser cash
      -BankAuthService bank
      +insertCard(String)
      +enterPin(String)
      +withdraw(int)
    }
    class ATMState {
      <<interface>>
      +insertCard(ATM, String)
      +enterPin(ATM, String)
      +withdraw(ATM, int)
    }
    class IdleState
    class CardInsertedState
    class AuthenticatedState
    class CashDispenser {
      +dispense(int) Map~Denom,int~
    }
    ATMState <|.. IdleState
    ATMState <|.. CardInsertedState
    ATMState <|.. AuthenticatedState
    ATM --> ATMState
    ATM *-- CashDispenser
`,
    hints: ['Strategy for cash dispense; State for ATM flow.'],
    starter: wrap(`
public class Main {
    interface ATMState {
        void insertCard(ATM a, String num);
        void enterPin(ATM a, String pin);
        void withdraw(ATM a, int amount);
    }
    static class ATM { ATMState state; int cash; /* ... */ }
    public static void main(String[] args){ System.out.println("LLD Arena · ATM"); }
}
`),
  },
  {
    id: 'p10',
    slug: 'splitwise',
    title: 'Design Splitwise',
    difficulty: 'medium',
    tags: ['Graph', 'Strategy'],
    concepts: ['Strategy pattern', 'Graph balances', 'Expense splitting'],
    description: wrap(`
A group of friends shares expenses. Splits can be **equal**, **exact**, or
**percentage**. The system tracks who owes whom and prints simplified balances.
`),
    requirements: [
      'addExpense(payer, amount, splits[], type)',
      'Three split strategies',
      'showBalances(user) and showAll()',
    ],
    bonus: ['Simplify debts: min number of transactions to settle (greedy/heap).'],
    rubric: [
      "A `SplitStrategy` interface — Equal / Exact / Percent each in its own class",
      "Balances stored as `Map<User, Map<User, Double>>` (symmetric or signed, one of the two)",
      "`addExpense` validates that the splits sum to the total (within ε)",
      "No floating-point bugs — round to 2 decimals consistently",
      "Showing balances does NOT mutate state",
    ],
    uml: `
classDiagram
    class ExpenseManager {
      -Map~User,Map~User,Double~~ balances
      +addExpense(Expense)
      +showBalance(User)
    }
    class Expense {
      -User payer
      -double total
      -List~Split~ splits
      -SplitStrategy strategy
    }
    class SplitStrategy {
      <<interface>>
      +split(double, List~Split~)
    }
    class EqualSplit
    class ExactSplit
    class PercentSplit
    SplitStrategy <|.. EqualSplit
    SplitStrategy <|.. ExactSplit
    SplitStrategy <|.. PercentSplit
    Expense --> SplitStrategy
    ExpenseManager o-- Expense
`,
    hints: ['`Map<User, Map<User, Double>> balances` — positive = owed to you.'],
    starter: wrap(`
import java.util.*;
public class Main {
    enum SplitType { EQUAL, EXACT, PERCENT }
    static class User { String id, name; User(String i,String n){id=i;name=n;} }
    static class Split { User user; double amount; }
    static class Expense { User payer; double total; List<Split> splits; SplitType type; }
    static class ExpenseManager {
        Map<String, Map<String, Double>> balances = new HashMap<>();
        // TODO: addExpense, show
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Splitwise"); }
}
`),
  },
  {
    id: 'p11',
    slug: 'library-management',
    title: 'Design a Library Management System',
    difficulty: 'medium',
    tags: ['OOP'],
    concepts: ['Composition', 'Domain modeling'],
    description: wrap(`
Members borrow and return books. Each book has multiple copies. Track active loans,
due dates, and overdue fines.
`),
    requirements: ['Book, BookItem (copy), Member, Loan', 'borrow / return / search'],
    rubric: [
      "`Book` (catalog entry) is separate from `BookItem` (physical copy)",
      "Loan has issueDate, dueDate, and an optional returnDate",
      "Overdue fine is computed by a `FineStrategy`, not hard-coded in `Loan`",
      "A member cannot exceed their max-loans cap",
      "Search by title/author/ISBN uses an index, not a linear scan over all books",
    ],
    uml: `
classDiagram
    class Library {
      -List~BookItem~ items
      -List~Member~ members
      +borrow(Member, BookItem)
      +returnBook(BookItem)
    }
    class Book {
      +String isbn
      +String title
    }
    class BookItem {
      +String barcode
      +bool checkedOut
    }
    class Member { +String id }
    class Loan {
      +Member member
      +BookItem item
      +Date due
    }
    Book <|-- BookItem
    Library *-- BookItem
    Library *-- Member
    Library *-- Loan
`,
    hints: ['Separate `Book` (catalog entry) from `BookItem` (physical copy).'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Book { String isbn, title, author; }
    static class BookItem extends Book { String barcode; boolean checkedOut; }
    static class Member { String id, name; List<BookItem> borrowed = new ArrayList<>(); }
    static class Library {
        // TODO: borrow, returnBook, search
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Library"); }
}
`),
  },
  {
    id: 'p12',
    slug: 'movie-booking',
    title: 'Design BookMyShow / Movie Ticket Booking',
    difficulty: 'medium',
    tags: ['Concurrency', 'OOP'],
    concepts: ['Optimistic locking', 'Pricing strategy', 'Seat hold'],
    description: wrap(`
A booking system for cinemas. A user picks a city → cinema → show → seats. Two
users may try to grab the same seat concurrently — exactly one must win.
`),
    requirements: [
      'City, Cinema, Screen, Show, Seat, Booking',
      'Seat hold with timeout, then confirm payment',
      'Search shows by movie/city/date',
    ],
    bonus: ['Surge pricing for weekend shows'],
    rubric: [
      "Domain split: City → Cinema → Screen → Show → Seat (no circular refs)",
      "Seat hold is timestamped; an expired hold auto-releases",
      "Two concurrent holds on the same seat — exactly one wins (CAS or lock)",
      "Booking is a separate aggregate from Show — never share mutable seat state",
      "`PricingStrategy` interface so weekend / surge pricing is swappable",
    ],
    uml: `
classDiagram
    class Cinema { +List~Screen~ screens }
    class Screen { +List~Show~ shows }
    class Show {
      +Movie movie
      +List~Seat~ seats
    }
    class Seat {
      +String id
      +SeatStatus status
    }
    class BookingService {
      +hold(Show, List~Seat~) HoldToken
      +confirm(HoldToken, Payment) Booking
    }
    Cinema *-- Screen
    Screen *-- Show
    Show *-- Seat
    BookingService --> Show
`,
    hints: ['`AtomicReference<Status>` per seat, or row-level lock in your data store.'],
    starter: wrap(`
import java.util.*;
public class Main {
    enum SeatStatus { FREE, HELD, BOOKED }
    static class Seat { String id; SeatStatus status = SeatStatus.FREE; }
    static class Show { String id; List<Seat> seats; }
    static class BookingService {
        // TODO: hold(showId, seatIds, userId) → holdToken
        // TODO: confirm(holdToken, payment) → Booking
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Movie Booking"); }
}
`),
  },
  {
    id: 'p13',
    slug: 'rate-limiter',
    title: 'Design a Rate Limiter',
    difficulty: 'medium',
    tags: ['Algorithms', 'Strategy'],
    concepts: ['Token bucket', 'Leaky bucket', 'Sliding window', 'Strategy pattern'],
    description: wrap(`
Build a rate limiter with pluggable algorithms — *Token Bucket*, *Leaky Bucket*,
*Fixed Window*, *Sliding Window Log*. Per-user / per-API keys are supported.
`),
    requirements: [
      'allow(userId) → boolean',
      'Pluggable algorithm via interface',
      'Token Bucket: capacity & refill rate',
    ],
    uml: `
classDiagram
    class RateLimiter {
      <<interface>>
      +allow(String) bool
    }
    class TokenBucket {
      -int capacity
      -double refillPerSec
      -Map~String,Bucket~ buckets
      +allow(String) bool
    }
    class LeakyBucket
    class FixedWindow
    class SlidingWindow
    RateLimiter <|.. TokenBucket
    RateLimiter <|.. LeakyBucket
    RateLimiter <|.. FixedWindow
    RateLimiter <|.. SlidingWindow
`,
    hints: ['Store last-refill timestamp per user; compute available tokens on read.'],
    starter: wrap(`
import java.util.*;
public class Main {
    interface RateLimiter { boolean allow(String userId); }
    static class TokenBucket implements RateLimiter {
        public TokenBucket(int capacity, double refillPerSec) {
            // TODO: store capacity & refill rate; per-user bucket state
        }
        public boolean allow(String userId) {
            // TODO
            return true;
        }
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Rate Limiter"); }
}
`),
    tests: {
      contract: [
        '`new Main.TokenBucket(capacity, refillPerSec)` constructor present',
        'First `capacity` calls for a new user return true',
        'Once tokens are exhausted, further immediate calls return false',
        'Different users have independent buckets',
      ],
      body: wrap(`
Main.RateLimiter rl = new Main.TokenBucket(5, 1.0);

int allowedU1 = 0;
for (int i = 0; i < 10; i++) if (rl.allow("u1")) allowedU1++;
check("burst respects capacity (got " + allowedU1 + ")", allowedU1 == 5);

// fresh user starts with full bucket regardless of u1's usage
int allowedU2 = 0;
for (int i = 0; i < 3; i++) if (rl.allow("u2")) allowedU2++;
check("independent bucket per user", allowedU2 == 3);

// u1 is still drained
check("drained bucket says no", !rl.allow("u1"));
`),
    },
  },
  {
    id: 'p14',
    slug: 'notification-system',
    title: 'Design a Notification System',
    difficulty: 'medium',
    tags: ['Strategy', 'Decorator', 'Observer'],
    concepts: ['Strategy', 'Decorator', 'Factory'],
    description: wrap(`
Send a notification to a user via Email, SMS, or Push. The same notification body
can be wrapped with formatters (HTML, plain text). Add new channels without
modifying the sender.
`),
    requirements: [
      'Channels: Email, SMS, Push',
      'Sender chooses channels per user preference',
      'Decorator: attach signature / disclaimers',
    ],
    rubric: [
      "A `Channel` interface; Email / SMS / Push are concrete classes",
      "Decorator wraps a notification with formatters (signature, disclaimer) without subclassing",
      "`NotificationService` knows nothing about specific channels (DI / Strategy)",
      "User preferences (which channels they want) live on the user, not the service",
      "Sending failure on one channel does NOT block the others",
    ],
    uml: `
classDiagram
    class NotificationService {
      -List~Channel~ channels
      +send(User, String)
    }
    class Channel {
      <<interface>>
      +send(String, String)
    }
    class EmailChannel
    class SmsChannel
    class PushChannel
    class FormattedNotification {
      <<decorator>>
      -Notification inner
    }
    Channel <|.. EmailChannel
    Channel <|.. SmsChannel
    Channel <|.. PushChannel
    NotificationService o-- Channel
`,
    hints: ['Strategy for channel; Decorator for body transforms.'],
    starter: wrap(`
public class Main {
    interface Channel { void send(String to, String body); }
    // TODO: EmailChannel, SmsChannel, PushChannel
    public static void main(String[] args){ System.out.println("LLD Arena · Notifications"); }
}
`),
  },
  {
    id: 'p15',
    slug: 'meeting-scheduler',
    title: 'Design a Meeting Scheduler',
    difficulty: 'medium',
    tags: ['OOP', 'Intervals'],
    concepts: ['Interval search', 'Room allocation', 'Observer (invite acceptance)'],
    description: wrap(`
Schedule meetings across rooms. Booking a slot must not overlap. The system finds
the earliest free room for a duration on a given day.
`),
    requirements: ['book(room, start, end)', 'findAvailable(duration, day) → Room?'],
    rubric: [
      "Per-room bookings live in a `TreeMap<Time, Booking>` (sorted)",
      "Overlap check uses `floorEntry` / `ceilingEntry` — O(log n), not O(n)",
      "`findAvailable(duration)` walks rooms and returns the first match (or empty)",
      "Cancellation frees the slot immediately",
      "Booking is rejected if any invitee has a conflict (not just the room)",
    ],
    uml: `
classDiagram
    class Scheduler {
      -List~Room~ rooms
      +book(Room, Booking)
      +findAvailable(int) Room
    }
    class Room {
      +String id
      -TreeMap~int,Booking~ bookings
    }
    class Booking {
      +int start
      +int end
      +String title
      +List~User~ invitees
    }
    Scheduler *-- Room
    Room o-- Booking
`,
    hints: ['Per-room `TreeMap<Time, Booking>`; `floorEntry` / `ceilingEntry` for overlap.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Booking { int start, end; String title; }
    static class Room { String id; TreeMap<Integer, Booking> bookings = new TreeMap<>(); }
    static class Scheduler {
        List<Room> rooms = new ArrayList<>();
        // TODO: book(), findAvailable()
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Scheduler"); }
}
`),
  },
  {
    id: 'p16',
    slug: 'food-delivery',
    title: 'Design a Food Delivery App (Swiggy/Zomato)',
    difficulty: 'medium',
    tags: ['OOP', 'Strategy'],
    concepts: ['Domain modeling', 'State pattern (order)', 'Strategy (matching)'],
    description: wrap(`
Restaurants list menus, users place orders, drivers pick up and deliver. Model the
order lifecycle and the driver-matching algorithm.
`),
    requirements: [
      'Restaurant, MenuItem, Order, Driver, User',
      'Order states: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED',
      'Driver matching strategy (nearest free)',
    ],
    rubric: [
      "Order state machine is explicit: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED",
      "Invalid state jumps (e.g. PLACED → DELIVERED) throw",
      "`DriverMatchingStrategy` is an interface — nearest, highest-rated, etc.",
      "Cart/Order pricing breakdown: items + tax + delivery fee + surge — all itemized",
      "`Restaurant` owns its menu; the platform does not edit menu items directly",
    ],
    uml: `
classDiagram
    class Order {
      -OrderState state
      -List~Item~ items
      -Driver driver
      +transition(OrderState)
    }
    class OrderState {
      <<enum>>
      PLACED
      ACCEPTED
      PREPARING
      OUT_FOR_DELIVERY
      DELIVERED
    }
    class Restaurant { +Menu menu }
    class Driver { +Location loc; +bool free }
    class MatchingStrategy {
      <<interface>>
      +pick(List~Driver~) Driver
    }
    Order --> OrderState
    Order --> Restaurant
    Order --> Driver
`,
    hints: ['Make order state transitions explicit; reject invalid jumps.'],
    starter: wrap(`
import java.util.*;
public class Main {
    enum OrderState { PLACED, ACCEPTED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED }
    static class Order { String id; OrderState state = OrderState.PLACED; /* items, user, driver */ }
    public static void main(String[] args){ System.out.println("LLD Arena · Food Delivery"); }
}
`),
  },
  {
    id: 'p17',
    slug: 'cab-booking',
    title: 'Design Uber / Ola Cab Booking',
    difficulty: 'medium',
    tags: ['Strategy', 'OOP'],
    concepts: ['Strategy (matching, pricing)', 'Geo grid lookup', 'State pattern'],
    description: wrap(`
A rider requests a cab; the system matches the best free driver nearby and computes
fare. Surge pricing kicks in based on supply / demand in a region.
`),
    requirements: [
      'requestRide(pickup, drop) → Ride',
      'Driver matching strategy: nearest, highest-rated, etc.',
      'Fare = base + per-km × distance × surge',
    ],
    rubric: [
      "Rider, Driver, Ride are distinct aggregates",
      "Drivers bucketed into a grid (or geo-hash) for O(1) neighbour lookup",
      "`MatchingStrategy` + `PricingStrategy` are both pluggable interfaces",
      "Ride has an explicit state machine (REQUESTED → ASSIGNED → STARTED → COMPLETED / CANCELLED)",
      "Surge multiplier is computed from a region's supply/demand, not hard-coded",
    ],
    uml: `
classDiagram
    class Ride {
      -RideState state
      -Rider rider
      -Driver driver
      -PricingStrategy pricing
    }
    class MatchingStrategy {
      <<interface>>
      +match(Location, List~Driver~) Driver
    }
    class PricingStrategy {
      <<interface>>
      +fare(double, double) double
    }
    class Nearest
    class HighestRated
    MatchingStrategy <|.. Nearest
    MatchingStrategy <|.. HighestRated
    Ride --> MatchingStrategy
    Ride --> PricingStrategy
`,
    hints: ['Bucket drivers into a coarse grid for O(1) neighbour lookup.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Location { double lat, lng; }
    static class Driver { String id; Location loc; boolean free = true; double rating; }
    interface DriverMatchingStrategy { Driver match(List<Driver> nearby); }
    public static void main(String[] args){ System.out.println("LLD Arena · Cab Booking"); }
}
`),
  },
  {
    id: 'p18',
    slug: 'amazon',
    title: 'Design Amazon / Online Shopping',
    difficulty: 'medium',
    tags: ['OOP'],
    concepts: ['Composite (cart)', 'Strategy (payments)', 'State (order)'],
    description: wrap(`
Catalog, cart, checkout, payments, orders. Focus on clean separation between
*catalog domain* and *cart/checkout domain*, and a pluggable \`PaymentStrategy\`.
`),
    requirements: [
      'Catalog with Product / Variant',
      'Cart: add/remove/updateQty, total',
      'Checkout → Payment → Order',
      'PaymentStrategy: Card, UPI, Wallet, COD',
    ],
    rubric: [
      "Catalog (Product/Variant) lives in its own package/namespace — no cart dependencies",
      "`Cart.add/remove/updateQty` validates against catalog stock",
      "`PaymentStrategy` interface — Card / UPI / Wallet / COD all implement it",
      "`Order` is created from a successful Payment, never from a raw Cart",
      "Order has its own state machine; Cart is throwaway after checkout",
    ],
    uml: `
classDiagram
    class Cart {
      -Map~Product,int~ items
      +add(Product, int)
      +total() double
    }
    class Product { +String id; +double price }
    class Order {
      -OrderState state
      -List~OrderLine~ lines
      -Payment payment
    }
    class PaymentStrategy {
      <<interface>>
      +pay(double) bool
    }
    class Card
    class UPI
    class Wallet
    PaymentStrategy <|.. Card
    PaymentStrategy <|.. UPI
    PaymentStrategy <|.. Wallet
    Cart *-- Product
    Order --> PaymentStrategy
`,
    hints: ['Cart should NOT know about payments. Order should.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Product { String id, name; double price; }
    static class Cart { Map<String, Integer> items = new LinkedHashMap<>(); /* ... */ }
    interface PaymentStrategy { boolean pay(double amount); }
    public static void main(String[] args){ System.out.println("LLD Arena · Amazon"); }
}
`),
  },
  {
    id: 'p19',
    slug: 'restaurant-management',
    title: 'Design a Restaurant Management System',
    difficulty: 'medium',
    tags: ['OOP'],
    concepts: ['Composite (table layout)', 'State (table/order)', 'Observer (kitchen)'],
    description: wrap(`
Tables, reservations, table occupancy, taking orders, kitchen tickets, billing,
payment.
`),
    requirements: [
      'Reservation with time window',
      'Order → KitchenTicket → Bill → Payment',
      'Table states: FREE, RESERVED, OCCUPIED, CLEANING',
    ],
    rubric: [
      "Table state machine: FREE → RESERVED → OCCUPIED → CLEANING → FREE",
      "`Order` and `Bill` are separate — one order can have multiple bills (split)",
      "Kitchen receives a `KitchenTicket` derived from the order, not the order itself",
      "Reservation conflicts are detected with interval overlap, not full scan",
      "Payment is its own step — applies to a Bill, not an Order",
    ],
    uml: `
classDiagram
    class Restaurant { -List~Table~ tables }
    class Table {
      +int number
      +TableState state
    }
    class Order { +List~Item~ items }
    class Bill {
      +Order order
      +double amount
    }
    class KitchenTicket { +List~Item~ items }
    Restaurant *-- Table
    Table o-- Order
    Order --> Bill
    Order --> KitchenTicket
`,
    hints: ['Decouple Order from Bill — one Order can have many bills (split).'],
    starter: wrap(`
import java.util.*;
public class Main {
    enum TableState { FREE, RESERVED, OCCUPIED, CLEANING }
    static class Table { int number, capacity; TableState state = TableState.FREE; }
    public static void main(String[] args){ System.out.println("LLD Arena · Restaurant"); }
}
`),
  },
  {
    id: 'p20',
    slug: 'file-system',
    title: 'Design an In-Memory File System',
    difficulty: 'medium',
    tags: ['Composite', 'Trie'],
    concepts: ['Composite pattern', 'Trie / tree traversal'],
    description: wrap(`
Files and folders as a tree. Operations: mkdir, addFile, readFile, ls, find. The
Composite pattern is the natural fit.
`),
    requirements: ['mkdir(path)', 'addFile(path, content)', 'readFile(path)', 'ls(path)'],
    rubric: [
      "Composite pattern — `File` and `Directory` both extend abstract `Node`",
      "Operations are recursive on `Directory` (ls, find), not flat lookups",
      "`mkdir -p` style creates intermediate directories",
      "Reading/creating a file under a non-existent parent throws (not silent)",
      "No path string parsing scattered everywhere — one `Path` utility",
    ],
    uml: `
classDiagram
    class Node {
      <<abstract>>
      +String name
      +isDir() bool
    }
    class File { +String content }
    class Directory {
      +Map~String,Node~ children
    }
    class FS {
      +Directory root
      +mkdir(String)
      +addFile(String, String)
      +readFile(String) String
      +ls(String) List~String~
    }
    Node <|-- File
    Node <|-- Directory
    Directory o-- Node
    FS *-- Directory
`,
    hints: ['One base abstract `Node`; `File` and `Directory` extend it.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static abstract class Node { String name; abstract boolean isDir(); }
    static class File extends Node { String content = ""; boolean isDir(){return false;} }
    static class Directory extends Node { Map<String, Node> children = new TreeMap<>(); boolean isDir(){return true;} }
    static class FS {
        Directory root = new Directory();
        // TODO: mkdir/addFile/readFile/ls
    }
    public static void main(String[] args){ System.out.println("LLD Arena · FS"); }
}
`),
  },

  // ───────────────────── HARD ─────────────────────
  {
    id: 'p21',
    slug: 'chess',
    title: 'Design Chess',
    difficulty: 'hard',
    tags: ['OOP', 'Game'],
    concepts: ['Polymorphism', 'Command (undo)', 'Strategy (AI)'],
    description: wrap(`
8×8 board, six piece types with their own movement rules, turn-based, detect
check / checkmate / stalemate. The piece-movement system MUST use polymorphism — no
giant switch on piece type.
`),
    requirements: [
      '6 pieces: Pawn, Rook, Knight, Bishop, Queen, King — each owns its move rules',
      'Detect check, checkmate, stalemate',
      'Castling, en passant, promotion',
    ],
    rubric: [
      "Every piece type is its own class; each implements `canMove(board, from, to)`",
      "No giant `switch` on piece type anywhere",
      "`Move` is a value object — supports `undo` (Command pattern)",
      "Check / Checkmate / Stalemate detection is on the `Board`, not on `Game`",
      "Castling, en-passant, and promotion each handled as special-case moves",
    ],
    uml: `
classDiagram
    class Game {
      -Board board
      -Player[] players
      -Color turn
      +move(Move) bool
    }
    class Board { +Piece[][] grid }
    class Piece {
      <<abstract>>
      +Color color
      +canMove(Board, int, int, int, int) bool
    }
    class King
    class Queen
    class Bishop
    class Knight
    class Rook
    class Pawn
    Piece <|-- King
    Piece <|-- Queen
    Piece <|-- Bishop
    Piece <|-- Knight
    Piece <|-- Rook
    Piece <|-- Pawn
    Game *-- Board
    Board *-- Piece
`,
    hints: ['`Piece.canMove(Board, from, to)` — every piece implements it.'],
    starter: wrap(`
public class Main {
    enum Color { WHITE, BLACK }
    static abstract class Piece { Color color; abstract boolean canMove(Board b, int fr, int fc, int tr, int tc); }
    static class Board { Piece[][] grid = new Piece[8][8]; }
    public static void main(String[] args){ System.out.println("LLD Arena · Chess"); }
}
`),
  },
  {
    id: 'p22',
    slug: 'stack-overflow',
    title: 'Design Stack Overflow',
    difficulty: 'hard',
    tags: ['OOP'],
    concepts: ['Composition', 'Observer (notifications)', 'Strategy (ranking)'],
    description: wrap(`
Users post Questions, Answers, Comments. Voting, reputation, badges, tags, search.
Reputation rules: +10 question up-vote, +10 answer up-vote, -2 down-vote, +15
accepted answer, etc.
`),
    requirements: [
      'Question, Answer, Comment, Vote, Badge, Tag',
      'Reputation engine',
      'Search by tag / text',
    ],
    rubric: [
      "User reputation is DERIVED from vote events, not stored as a counter",
      "`Question`, `Answer`, `Comment` share a `Post` base (votable + commentable)",
      "Tags are first-class entities, not strings on Question",
      "Search is by tag/text via an index (Map<Tag, Set<Question>>)",
      "Accepted-answer logic lives on Question, not Answer",
    ],
    uml: `
classDiagram
    class Post {
      <<abstract>>
      +User author
      +int score
      +List~Comment~ comments
    }
    class Question {
      +String title
      +Set~Tag~ tags
      +List~Answer~ answers
      +Answer accepted
    }
    class Answer
    class Comment
    class User { +int reputation; +Set~Badge~ badges }
    class Vote { +int value }
    Post <|-- Question
    Post <|-- Answer
    Question *-- Answer
    Post *-- Comment
    Post --> User
    Post o-- Vote
`,
    hints: ['Vote is an event; reputation derives from events, not stored counters.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class User { String id, name; int reputation; Set<String> badges = new HashSet<>(); }
    static class Question { String id, title, body; User asker; List<Answer> answers = new ArrayList<>(); }
    static class Answer { String id; User author; String body; int score; }
    public static void main(String[] args){ System.out.println("LLD Arena · StackOverflow"); }
}
`),
  },
  {
    id: 'p23',
    slug: 'twitter',
    title: 'Design Twitter / X',
    difficulty: 'hard',
    tags: ['OOP', 'Algorithms'],
    concepts: ['Fan-out on write vs read', 'Heap-merge for timeline'],
    description: wrap(`
Users post tweets, follow other users, view a home timeline ordered by recency.
Implement timeline assembly with k-way heap merge.
`),
    requirements: [
      'postTweet(userId, text)',
      'follow / unfollow',
      'getNewsFeed(userId) → 10 most recent tweets across followees',
    ],
    rubric: [
      "`getNewsFeed(userId)` uses a k-way merge with a min-heap, not collect-and-sort",
      "Per-user tweets are stored as a list ordered by timestamp",
      "Follow set is a `Set<UserId>`, not a list",
      "Feed is read-time computed (fan-out on read), or write-time (fan-out on write) — pick ONE and document it",
      "Unfollowing removes the user from the follow set, not just marks them inactive",
    ],
    uml: `
classDiagram
    class Twitter {
      +postTweet(int, String)
      +follow(int, int)
      +unfollow(int, int)
      +getNewsFeed(int) List~Tweet~
    }
    class User {
      +int id
      +Set~int~ following
      +List~Tweet~ tweets
    }
    class Tweet {
      +int id
      +String text
      +long ts
    }
    Twitter o-- User
    User *-- Tweet
`,
    hints: ['Min-heap of size = #followees; pop and advance per followee feed.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Twitter {
        // TODO: per-user tweet list, follow set, getNewsFeed
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Twitter"); }
}
`),
  },
  {
    id: 'p24',
    slug: 'airbnb',
    title: 'Design Airbnb',
    difficulty: 'hard',
    tags: ['OOP', 'Search'],
    concepts: ['Search filters', 'Booking conflicts', 'Strategy (pricing)'],
    description: wrap(`
Listings, hosts, search by city/dates/guests, booking with overlap check, payment,
reviews.
`),
    requirements: [
      'Listing, Booking, User (host/guest)',
      'Search filters: city, date range, guests, price, amenities',
      'Booking rejects on date overlap',
    ],
    rubric: [
      "Listing bookings indexed by date for O(log n) overlap check",
      "Booking creation rejects overlapping date ranges atomically",
      "Search filters compose — city + dates + guests + price all narrow the result",
      "`PricingStrategy` separate from Listing (weekend, peak, etc.)",
      "Host and Guest are roles on `User`, not different classes",
    ],
    uml: `
classDiagram
    class Listing {
      +String id
      +String city
      +double pricePerNight
      +TreeMap~int,Booking~ bookings
    }
    class Booking {
      +int startDay
      +int endDay
      +User guest
    }
    class PricingStrategy {
      <<interface>>
      +price(Listing, int, int) double
    }
    class User { +String id; +bool isHost }
    Listing o-- Booking
    Listing --> PricingStrategy
    Booking --> User
`,
    hints: ['Interval tree (or TreeMap+floorEntry) per listing for overlap check.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Listing { String id, city; int guests; double pricePerNight; }
    static class Booking { String listingId; int startDay, endDay; }
    public static void main(String[] args){ System.out.println("LLD Arena · Airbnb"); }
}
`),
  },
  {
    id: 'p25',
    slug: 'distributed-cache',
    title: 'Design a Distributed Cache',
    difficulty: 'hard',
    tags: ['Consistent Hashing', 'Algorithms'],
    concepts: ['Consistent hashing', 'Virtual nodes', 'LRU eviction'],
    description: wrap(`
Multi-node cache. Use consistent hashing to map keys → nodes; support add/remove of
nodes with minimal key reshuffling. Each node has its own LRU.
`),
    requirements: [
      'Consistent hash ring with virtual nodes',
      'put(k,v) / get(k) route to the right node',
      'Re-balance on node add/remove',
    ],
    rubric: [
      "Hash ring stored in a `TreeMap<Long, Node>`; routing uses `ceilingEntry`",
      "Virtual nodes per physical node — minimum 64 to spread load",
      "`addNode`/`removeNode` re-balance ONLY the affected key range",
      "Each node has its own LRU eviction",
      "Routing is read-only — no locks taken on the read path",
    ],
    uml: `
classDiagram
    class HashRing {
      -TreeMap~Long,Node~ ring
      +addNode(Node)
      +removeNode(Node)
      +route(String) Node
    }
    class Node {
      +String id
      -LinkedHashMap~String,String~ store
      +put(String, String)
      +get(String) String
    }
    class Client {
      +put(String, String)
      +get(String) String
    }
    HashRing o-- Node
    Client --> HashRing
`,
    hints: ['`TreeMap<Long, Node>` keyed by hash → use `ceilingEntry` for routing.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Node { String id; LinkedHashMap<String,String> store = new LinkedHashMap<>(); }
    static class HashRing {
        TreeMap<Long, Node> ring = new TreeMap<>();
        // TODO: addNode, removeNode, route(key)
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Distributed Cache"); }
}
`),
  },
  {
    id: 'p26',
    slug: 'stock-exchange',
    title: 'Design a Stock Exchange / Order Matching Engine',
    difficulty: 'hard',
    tags: ['Heap', 'Algorithms'],
    concepts: ['Two priority queues', 'Price-time priority', 'Order types'],
    description: wrap(`
Match buy and sell orders by price-time priority. Support Market and Limit orders.
Print trades as matches happen.
`),
    requirements: [
      'Order types: MARKET, LIMIT',
      'Buy book (max-heap), Sell book (min-heap)',
      'Cancel pending order',
    ],
    rubric: [
      "Buy book is a max-heap by price, sell book is a min-heap by price",
      "Tie-break by timestamp (price-time priority)",
      "Market orders consume the opposite book until filled or empty",
      "Limit orders rest in their side's book if not immediately matched",
      "Cancel removes the order regardless of its position in the book",
    ],
    uml: `
classDiagram
    class Engine {
      -PriorityQueue~Order~ bids
      -PriorityQueue~Order~ asks
      +place(Order)
      +cancel(String)
      -match()
    }
    class Order {
      +String id
      +Side side
      +Type type
      +double price
      +int qty
      +long ts
    }
    class Trade { +Order buy; +Order sell; +double price; +int qty }
    Engine o-- Order
    Engine ..> Trade : emits
`,
    hints: ['Limit orders rest; market orders consume the top of the opposite book.'],
    starter: wrap(`
import java.util.*;
public class Main {
    enum Side { BUY, SELL } enum Type { LIMIT, MARKET }
    static class Order { String id; Side side; Type type; double price; int qty; long ts; }
    static class Engine {
        PriorityQueue<Order> bids = new PriorityQueue<>((a,b)-> Double.compare(b.price,a.price));
        PriorityQueue<Order> asks = new PriorityQueue<>((a,b)-> Double.compare(a.price,b.price));
        // TODO: place, cancel, match()
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Exchange"); }
}
`),
  },
  {
    id: 'p27',
    slug: 'google-calendar',
    title: 'Design Google Calendar',
    difficulty: 'hard',
    tags: ['Intervals', 'OOP'],
    concepts: ['Interval merging', 'Recurrence rules', 'Time zones'],
    description: wrap(`
Events with start/end, recurrence (daily / weekly / monthly), invitees, reminders,
free-busy queries across calendars.
`),
    requirements: [
      'Single event + recurring event',
      'free-busy in [start,end] across calendars',
      'Invite + RSVP',
    ],
    rubric: [
      "Recurring events are NOT materialized — a `RecurrenceRule` generates occurrences on demand",
      "Free-busy across calendars merges intervals, not occurrences one-by-one",
      "Time zone is stored on the event, never assumed UTC",
      "Invitee RSVP state is on the invitee, not on the event",
      "Reminder is a separate aggregate; deleting an event cascades to its reminders",
    ],
    uml: `
classDiagram
    class Calendar { -List~Event~ events }
    class Event {
      +long start
      +long end
      +RecurrenceRule rule
      +List~Invitee~ invitees
    }
    class RecurrenceRule {
      +occurrencesBetween(long, long) List~Range~
    }
    class Invitee {
      +User user
      +RsvpStatus status
    }
    Calendar *-- Event
    Event --> RecurrenceRule
    Event *-- Invitee
`,
    hints: ['Recurrence rule = generator function — do not materialize forever.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Event { String id, title; long start, end; String recurrence; List<String> invitees; }
    static class Calendar { List<Event> events = new ArrayList<>(); /* freeBusy() */ }
    public static void main(String[] args){ System.out.println("LLD Arena · Calendar"); }
}
`),
  },
  {
    id: 'p28',
    slug: 'whatsapp',
    title: 'Design WhatsApp',
    difficulty: 'hard',
    tags: ['OOP', 'Observer'],
    concepts: ['Observer', 'State (message status)', 'Group abstraction'],
    description: wrap(`
1-1 and group chats. Message states: SENT → DELIVERED → READ. Group admins,
mentions, last-seen, typing indicators.
`),
    requirements: [
      'User, Chat (1-1 or Group), Message',
      'Message states with timestamps',
      'Group: admins, members, mute',
    ],
    rubric: [
      "1-1 and group chats use the same `Chat` abstraction (group with 2 members)",
      "Message states (SENT / DELIVERED / READ) advance per recipient, not per message",
      "Group admin permissions are checked at action sites, not stored as bool flags",
      "Last-seen and typing indicators are events, not properties on User",
      "Mute is per-user-per-chat, not global on the chat",
    ],
    uml: `
classDiagram
    class Chat {
      -Set~User~ members
      -List~Message~ messages
      +send(User, String)
    }
    class Message {
      +String text
      +Map~User,MsgState~ statePerRecipient
    }
    class GroupChat {
      -Set~User~ admins
    }
    class User { +String id; +long lastSeen }
    Chat <|-- GroupChat
    Chat o-- User
    Chat *-- Message
`,
    hints: ['Treat 1-1 as a 2-member group internally — fewer code paths.'],
    starter: wrap(`
import java.util.*;
public class Main {
    enum MsgState { SENT, DELIVERED, READ }
    static class Message { String id, text; MsgState state = MsgState.SENT; }
    static class Chat { Set<String> members = new HashSet<>(); List<Message> msgs = new ArrayList<>(); }
    public static void main(String[] args){ System.out.println("LLD Arena · WhatsApp"); }
}
`),
  },
  {
    id: 'p29',
    slug: 'youtube',
    title: 'Design YouTube',
    difficulty: 'hard',
    tags: ['OOP', 'Strategy'],
    concepts: ['Strategy (encoding pipeline)', 'Observer (subscriptions)', 'Composite (playlists)'],
    description: wrap(`
Upload videos, transcode to multiple resolutions, stream, like/dislike, comment,
subscribe to channels, recommended feed.
`),
    requirements: [
      'Video upload + encoding pipeline (Strategy)',
      'Subscriptions + notifications (Observer)',
      'Recommendations strategy (trending / personalized)',
    ],
    rubric: [
      "Encoding pipeline is a chain of `EncodingStep` objects, swappable in order",
      "Subscription notifications go through the `Observer` interface",
      "Playlists implement Composite — a playlist can contain playlists",
      "Recommendation logic is a `RecommendationStrategy`",
      "View counts are append-only events; counters are derived",
    ],
    uml: `
classDiagram
    class Video {
      +String id
      +long bytes
      +List~Rendition~ renditions
    }
    class EncodingStep {
      <<interface>>
      +run(Video)
    }
    class TranscodeStep
    class ThumbnailStep
    class CdnPushStep
    class Channel {
      +Set~User~ subscribers
      +upload(Video)
    }
    class RecommendationStrategy {
      <<interface>>
      +rank(User, List~Video~) List~Video~
    }
    EncodingStep <|.. TranscodeStep
    EncodingStep <|.. ThumbnailStep
    EncodingStep <|.. CdnPushStep
    Channel *-- Video
    Video --> EncodingStep
`,
    hints: ['Encoding pipeline = chain of `EncodingStep`s.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Video { String id, title; long bytes; List<String> renditions = new ArrayList<>(); }
    interface EncodingStep { void run(Video v); }
    public static void main(String[] args){ System.out.println("LLD Arena · YouTube"); }
}
`),
  },
  {
    id: 'p30',
    slug: 'concurrent-hashmap',
    title: 'Design a Concurrent Hash Map',
    difficulty: 'hard',
    tags: ['Concurrency'],
    concepts: ['Striped locks', 'Resize', 'Volatile / CAS'],
    description: wrap(`
Implement a thread-safe hash map. Lock-stripe so different shards can be written
concurrently. Resize without blocking the whole map.
`),
    requirements: ['put / get / remove are thread-safe', 'Stripe-level locking'],
    rubric: [
      "Map is striped into ≥ 16 segments — each with its own lock",
      "put/get/remove only lock the relevant stripe, never the whole map",
      "Resize moves keys segment-by-segment, not all at once",
      "No `synchronized` on the public methods — fine-grained locks only",
      "Iterator is weakly consistent (or explicit snapshot), not throw-on-modify",
    ],
    uml: `
classDiagram
    class StripedMap~K,V~ {
      -ReentrantLock[] locks
      -HashMap~K,V~[] buckets
      +put(K, V)
      +get(K) V
      +remove(K)
      -stripeFor(K) int
    }
    note for StripedMap "16 stripes by default"
`,
    hints: ["Java's ConcurrentHashMap uses CAS + bins. Start with 16 stripes."],
    starter: wrap(`
import java.util.*; import java.util.concurrent.locks.*;
public class Main {
    static class StripedMap<K,V> {
        final int stripes = 16;
        final ReentrantLock[] locks;
        final HashMap<K,V>[] buckets;
        @SuppressWarnings("unchecked")
        StripedMap(){ locks=new ReentrantLock[stripes]; buckets=new HashMap[stripes];
            for(int i=0;i<stripes;i++){locks[i]=new ReentrantLock();buckets[i]=new HashMap<>();} }
        // TODO: put/get/remove with proper locking
    }
    public static void main(String[] args){ System.out.println("LLD Arena · Concurrent Map"); }
}
`),
  },
  {
    id: 'p31',
    slug: 'url-shortener',
    title: 'Design a URL Shortener (bit.ly)',
    difficulty: 'medium',
    tags: ['Algorithms', 'OOP'],
    concepts: ['Base62 encoding', 'ID generation', 'TTL'],
    description: wrap(`
Long URL → short token (base62 of 64-bit ID). Resolve token → long URL. Optional
custom alias, optional TTL, click counts.
`),
    requirements: ['shorten(url, ttl?, alias?) → token', 'resolve(token) → url or null'],
    uml: `
classDiagram
    class Shortener {
      -Map~String,Entry~ store
      -IdGenerator gen
      +shorten(String) String
      +shorten(String, long) String
      +resolve(String) String
    }
    class IdGenerator {
      <<interface>>
      +next() long
    }
    class Base62 {
      +encode(long) String
      +decode(String) long
    }
    class Entry {
      +String url
      +long expiresAt
      +int clicks
    }
    Shortener --> IdGenerator
    Shortener ..> Base62
    Shortener o-- Entry
`,
    hints: ['Base62 alphabet = [0-9A-Za-z], 62^7 ≈ 3.5 trillion.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Shortener {
        Map<String, String> store = new HashMap<>();

        public String shorten(String longUrl) {
            // TODO: generate base62 token, persist, return token
            return null;
        }
        public String resolve(String token) {
            // TODO: return original URL or null
            return null;
        }
    }
    public static void main(String[] args){ System.out.println("LLD Arena · URL Shortener"); }
}
`),
    tests: {
      contract: [
        '`shorten(url)` returns a non-empty token',
        'Different URLs get different tokens',
        '`resolve(token)` returns the exact original URL',
        '`resolve(unknown)` returns null',
      ],
      body: wrap(`
Main.Shortener s = new Main.Shortener();
String t1 = s.shorten("https://example.com/a");
String t2 = s.shorten("https://example.com/b");
check("token non-empty", t1 != null && !t1.isEmpty());
check("tokens differ for different urls", !t1.equals(t2));
check("round-trip a", "https://example.com/a".equals(s.resolve(t1)));
check("round-trip b", "https://example.com/b".equals(s.resolve(t2)));
check("unknown resolves to null", s.resolve("does-not-exist-zzz") == null);
`),
    },
  },
  {
    id: 'p32',
    slug: 'true-caller',
    title: 'Design TrueCaller / Contact Manager',
    difficulty: 'medium',
    tags: ['Trie', 'OOP'],
    concepts: ['Trie / prefix search', 'Reverse-number lookup'],
    description: wrap(`
Build a phone-book / TrueCaller. Lookup by name (prefix) and by number (reverse).
Spam reports raise a counter; cross a threshold → marked spam.
`),
    requirements: ['add(name, number)', 'searchByPrefix(prefix) → names', 'reportSpam(number)'],
    rubric: [
      "Prefix search uses a Trie, not a list scan",
      "Reverse lookup (number → contact) uses a HashMap, O(1)",
      "Spam reports are counters per number; cross-threshold flips an `isSpam` flag",
      "Adding/removing contacts updates BOTH indexes consistently",
      "Search results are ranked (spam pushed down, frequent contacts up)",
    ],
    uml: `
classDiagram
    class TrueCaller {
      -Trie trie
      -Map~String,Contact~ byNumber
      -Map~String,int~ spamCount
      +add(String, String)
      +searchByPrefix(String) List~Contact~
      +reportSpam(String)
    }
    class Trie {
      +insert(String, Contact)
      +prefix(String) List~Contact~
    }
    class Contact {
      +String name
      +String number
      +bool isSpam
    }
    TrueCaller *-- Trie
    TrueCaller o-- Contact
`,
    hints: ['Two indexes: prefix trie on names, hashmap on numbers.'],
    starter: wrap(`
import java.util.*;
public class Main {
    static class Trie { /* TODO */ }
    static class TrueCaller {
        // TODO: trie + number→contact map + spam counts
    }
    public static void main(String[] args){ System.out.println("LLD Arena · TrueCaller"); }
}
`),
  },
];

export const SLUGS = PROBLEMS.map((p) => p.slug);

export function getProblem(slug: string): Problem | undefined {
  return PROBLEMS.find((p) => p.slug === slug);
}
