// Inject `uml: \`...\`` into each Problem object, just before its `hints:` field.
// Idempotent — re-running is a no-op.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../src/data/problems.ts', import.meta.url);

/** Mermaid class-diagram source per slug. Compact, readable. */
const UMLS = {
  'parking-lot': `classDiagram
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
    ParkingSpot --> Vehicle`,

  'vending-machine': `classDiagram
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
    VendingMachine --> MachineState`,

  'snake-and-ladder': `classDiagram
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
    Board *-- Jump`,

  'tic-tac-toe': `classDiagram
    class TicTacToe {
      -int n
      -int[] rows
      -int[] cols
      -int diag
      -int anti
      +move(int, int, int) int
    }
    note for TicTacToe "O(1) per move via running counters"`,

  'lru-cache': `classDiagram
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
    LRU *-- Node`,

  logger: `classDiagram
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
    LogProcessor --> LogProcessor : next`,

  'pub-sub': `classDiagram
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
    Broker o-- Subscriber`,

  'elevator-system': `classDiagram
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
    ElevatorSystem --> DispatchStrategy`,

  atm: `classDiagram
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
    ATM *-- CashDispenser`,

  splitwise: `classDiagram
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
    ExpenseManager o-- Expense`,

  'library-management': `classDiagram
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
    Library *-- Loan`,

  'movie-booking': `classDiagram
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
    BookingService --> Show`,

  'rate-limiter': `classDiagram
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
    RateLimiter <|.. SlidingWindow`,

  'notification-system': `classDiagram
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
    NotificationService o-- Channel`,

  'meeting-scheduler': `classDiagram
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
    Room o-- Booking`,

  'food-delivery': `classDiagram
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
    Order --> Driver`,

  'cab-booking': `classDiagram
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
    Ride --> PricingStrategy`,

  amazon: `classDiagram
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
    Order --> PaymentStrategy`,

  'restaurant-management': `classDiagram
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
    Order --> KitchenTicket`,

  'file-system': `classDiagram
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
    FS *-- Directory`,

  chess: `classDiagram
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
    Board *-- Piece`,

  'stack-overflow': `classDiagram
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
    Post o-- Vote`,

  twitter: `classDiagram
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
    User *-- Tweet`,

  airbnb: `classDiagram
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
    Booking --> User`,

  'distributed-cache': `classDiagram
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
    Client --> HashRing`,

  'stock-exchange': `classDiagram
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
    Engine ..> Trade : emits`,

  'google-calendar': `classDiagram
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
    Event *-- Invitee`,

  whatsapp: `classDiagram
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
    Chat *-- Message`,

  youtube: `classDiagram
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
    Video --> EncodingStep`,

  'concurrent-hashmap': `classDiagram
    class StripedMap~K,V~ {
      -ReentrantLock[] locks
      -HashMap~K,V~[] buckets
      +put(K, V)
      +get(K) V
      +remove(K)
      -stripeFor(K) int
    }
    note for StripedMap "16 stripes by default"`,

  'url-shortener': `classDiagram
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
    Shortener o-- Entry`,

  'true-caller': `classDiagram
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
    TrueCaller o-- Contact`,
};

const src = readFileSync(FILE, 'utf8');
let out = src;
let touched = 0;
let skipped = 0;

for (const [slug, uml] of Object.entries(UMLS)) {
  const slugIdx = out.indexOf(`slug: '${slug}',`);
  if (slugIdx < 0) {
    console.warn(`! slug not found: ${slug}`);
    continue;
  }
  const blockEnd = out.indexOf('\n  },', slugIdx);
  if (blockEnd < 0) {
    console.warn(`! object end not found for ${slug}`);
    continue;
  }
  const region = out.slice(slugIdx, blockEnd);
  if (region.includes('uml:')) {
    skipped++;
    continue;
  }

  // Insert before `    hints:`
  const hintsRel = region.indexOf('    hints:');
  if (hintsRel < 0) {
    console.warn(`! hints field not found in ${slug}`);
    continue;
  }
  const hintsAbs = slugIdx + hintsRel;

  // Render the UML using a template literal so multi-line is safe.
  // Escape backticks/backslashes/${} inside.
  const escaped = uml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  const umlBlock = `    uml: \`\n${escaped}\n\`,\n`;

  out = out.slice(0, hintsAbs) + umlBlock + out.slice(hintsAbs);
  touched++;
}

writeFileSync(FILE, out, 'utf8');
console.log(`Done. Injected ${touched} UMLs, skipped ${skipped}.`);
