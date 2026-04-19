# NEMESIS Protocol — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| **Product** | NEMESIS Protocol — Tokenized EV Infrastructure Protocol |
| **Umbrella** | NEMESIS Protocol (investor + operator + governance) |
| **Sub-apps** | Nemesis Drive (driver), Nemesis Work (workshop/bengkel) |
| **Version** | v0.1 (Colosseum Frontier submission baseline) |
| **Date** | 2026-04-19 |
| **Owner** | Nemesis Core Team |
| **Status** | DRAFT — Pending engineering kickoff |
| **Related Docs** | `docs/NEMESIS_Protocol_Pitch_EN.md`, `docs/NEMESIS_Protocol_Pitch_ID.md` |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & North Star](#2-product-vision--north-star)
3. [Dual-App Architecture](#3-dual-app-architecture)
4. [User Personas & Journeys](#4-user-personas--journeys)
5. [Nemesis Drive & Work Module PRD](#5-nemesis-drive--work-module-prd)
6. [NEMESIS Protocol Module PRD](#6-nemesis-protocol-module-prd)
7. [Proof of Activity Layer](#7-proof-of-activity-layer)
8. [Proof of Revenue Layer](#8-proof-of-revenue-layer)
9. [Design System & Theming Rules](#9-design-system--theming-rules)
10. [Tech Stack & Infrastructure](#10-tech-stack--infrastructure)
11. [Data Model](#11-data-model)
12. [Refactor Plan](#12-refactor-plan)
13. [Roadmap](#13-roadmap)
14. [Open Questions & Risks](#14-open-questions--risks)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

NEMESIS Protocol is a Solana-based DePIN (Decentralized Physical Infrastructure Network) that tokenizes real-world revenue-generating EV fleets — starting with Module 1 (productive EV vehicles: electric motorcycles, cars, vans, trucks, buses) in Indonesia — into fractional on-chain shares backed by three cryptographic guarantees:

1. **Proof of Asset** — each vehicle's ownership is represented by 1,000 SPL share tokens (reference unit: Rp 30 million vehicle ⇒ 30,000 IDRX per share).
2. **Proof of Activity** — GPS telemetry from every vehicle is hashed daily and anchored on-chain. A node score (0-100) gates revenue eligibility.
3. **Proof of Revenue** — daily revenue is verified through a GPS correlation band (±40%), optionally screenshot-anchored (Phase 1) or API-pulled (Phase 2), and split on-chain via an Anchor program: **70% driver / 20% investor pool / 7% protocol / 3% maintenance fund**.

The protocol ships as **two distinct Next.js applications** in one repository:

- **`frontend noc id`** — refactored from the existing NOC ID code. Houses Nemesis Drive (driver app, light theme, mobile-first) and Nemesis Work (workshop app, dark theme, desktop-first). Scope: Proof of Activity submission only.
- **`frontend nemesis`** — new Next.js app. Houses the umbrella landing page, investor marketplace, operator (fleet owner) portal, and super admin (internal Nemesis team) portal.

**Why two apps?** Different users, different physical contexts, different theme defaults, and a hard scope line: NOC ID (folder) never touches tokenization, investor flows, or governance. Nemesis (folder) never touches raw GPS ingestion or workshop invoicing. This separation keeps attack surface small, bundle sizes lean, and each product's copy laser-focused on its audience.

**North Star metric (12-month target):** 1,000 vehicles onboarded with ≥85% uptime (node score ≥70), Rp 30 billion in share tokens outstanding, weekly yield distribution to ≥500 unique investor wallets, APY 30-41.6% (base + $NMS booster).

**Colosseum Frontier phase (Q2 2026):** PRD (this doc), architecture, stubbed dual-app frontends, Anchor program scaffolding on devnet.
**Phase 1 Pilot (Q3 2026):** 5–10 pilot vehicles with real drivers in Jakarta, manual revenue submission, IDRX yield distribution live.
**Phase 2 (Q4 2026):** IDO $NMS, Gojek/Grab OAuth integration for auto-revenue pull, 100 active vehicles.

This document specifies product scope, user journeys, data schemas (on-chain + off-chain), UI surfaces per persona, the Proof of Revenue anti-fraud design, tech stack, theming rules, and the refactor execution plan that turns today's monolithic NOC ID frontend into the two-app NEMESIS Protocol.

---

## 2. Product Vision & North Star

### 2.1 Mission

> **"Make every productive EV a yield-generating asset owned collectively by its riders, its operators, and its believers — settled transparently on-chain."**

NEMESIS exists because Indonesia's EV transition is financing-constrained, not demand-constrained. Drivers want electric motorcycles because the unit economics beat petrol; fleet operators want to scale but face capex walls; retail investors want Rupiah-denominated yield exposure to the real economy without entering opaque P2P schemes. Tokenization on Solana, with IDRX as the settlement currency, solves all three pain points with one primitive: **fractional, yield-bearing, on-chain shares of real vehicles whose activity and revenue are cryptographically provable**.

### 2.2 Principles

- **P1 — Physical truth first, token second.** Every on-chain share is backed by a VIN, a GPS feed, and a real driver. No synthetic exposure, no derivatives.
- **P2 — Verification, not trust.** Revenue splits execute on-chain the moment a submission is approved. Operators cannot delay, siphon, or reroute flow.
- **P3 — Rupiah-native, not Rupiah-abstracted.** IDRX is the unit of account. Drivers earn in IDRX, investors yield in IDRX, protocol fees collected in IDRX. $NMS exists for governance and yield-boost mechanics, not as a payment rail.
- **P4 — Indonesia-first, not Indonesia-only.** Phase 1-3 in Indonesia. Protocol primitives are region-agnostic and replicable (Vietnam, Philippines, Thailand in later phases).
- **P5 — Progressive decentralization.** Phase 1 has admin emergency overrides. Phase 3 hands parameter-tuning to $NMS governance. Phase 5 removes the admin backdoor entirely.
- **P6 — Low cognitive load per persona.** Driver sees only what they need to earn. Investor sees only what they need to invest. Operator sees the fleet ops surface. Admin sees the levers. Nobody sees everything.

### 2.3 Success Metrics (North Star + Supporting KPIs)

**North Star (12-month):** Weekly Active Fleet Coverage (WAFC) — percentage of onboarded vehicles that completed ≥5 days of valid Proof of Activity in a rolling 7-day window. Target: ≥85%.

**Supporting KPIs:**

| KPI | Definition | 6-mo target | 12-mo target |
|---|---|---|---|
| Onboarded vehicles | SPL share token mints active | 100 | 1,000 |
| Active drivers | Drivers with ≥1 valid PoA in last 7d | 80 | 800 |
| TVL (IDRX locked) | Sum of share token × current price | Rp 3 B | Rp 30 B |
| Weekly distributions | Successful yield payouts per week | 1 (stable) | 1 (stable, never missed) |
| Unique investor wallets | Distinct wallets holding ≥1 share | 200 | 2,000 |
| $NMS staked | Tokens staked for yield booster | 2M | 15M |
| Protocol fee revenue | 7% cut, annualized run rate | Rp 200M ARR | Rp 3 B ARR |
| Node score P50 | Median driver node score | ≥72 | ≥78 |
| Revenue submission auto-approve rate | % submissions within GPS correlation band | ≥70% | ≥85% |
| Operator NPS | Fleet owner net promoter score | N/A | ≥40 |

### 2.4 Non-Goals

- **Not a consumer ride-hailing app.** NEMESIS does not replace Gojek/Grab. We sit *underneath* those platforms as infrastructure financing.
- **Not a consumer P2P lending platform.** Investors buy fractional vehicle shares, not loans to drivers. No interest rate, no lending contract, no repayment schedule.
- **Not a general-purpose RWA platform.** Scope is Module 1 (productive EV) through Module 3 (charging + solar). Real estate, commodities, invoice factoring etc. are explicitly out of scope.
- **Not a crypto-native trading venue.** Secondary market opens Phase 3 (Q1-Q2 2027). Phase 1-2 is primary issuance only, buy-and-hold semantics.

---

## 3. Dual-App Architecture

### 3.1 System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                          NEMESIS PROTOCOL (umbrella)                         │
│                                                                              │
│  ┌─────────────────────────────┐        ┌─────────────────────────────┐      │
│  │   frontend nemesis          │        │   frontend noc id           │      │
│  │   (new Next.js app)         │        │   (refactored existing)     │      │
│  │                             │        │                             │      │
│  │   /         landing         │        │   /         Drive/Work lp   │      │
│  │   /marketplace              │        │   /drive/*  Nemesis Drive   │      │
│  │   /invest/[fleetId]         │        │             (light, mobile) │      │
│  │   /portfolio                │        │   /work/*   Nemesis Work    │      │
│  │   /explorer                 │        │             (dark, desktop) │      │
│  │   /operator/* (dark)        │        │                             │      │
│  │   /admin/*    (dark)        │        │                             │      │
│  │                             │        │                             │      │
│  │   Users: investor, operator,│        │   Users: driver, workshop   │      │
│  │          admin, visitor     │        │                             │      │
│  └─────────────┬───────────────┘        └──────────────┬──────────────┘      │
│                │                                       │                     │
│                │ RPC + Anchor client                   │ RPC + ingest svc    │
│                ▼                                       ▼                     │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                        SOLANA (mainnet)                          │        │
│  │                                                                  │        │
│  │   Anchor programs:                                               │        │
│  │     • proof-of-activity    (daily hash anchor)                   │        │
│  │     • proof-of-revenue     (submit + validate + split)           │        │
│  │     • share-mint           (SPL share tokens per vehicle)        │        │
│  │     • yield-distribution   (weekly batch distribute)             │        │
│  │     • governance           ($NMS staking + proposals)            │        │
│  │                                                                  │        │
│  │   Tokens:                                                        │        │
│  │     • IDRX  (settlement)    — external SPL issuance              │        │
│  │     • $NMS  (governance)    — own mint, 100M supply              │        │
│  │     • Share (per vehicle)   — 1,000 units per mint               │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │                    OFF-CHAIN INFRASTRUCTURE                      │        │
│  │   • GPS ingestion service (Rust/Node.js, receives MQTT/HTTPS)    │        │
│  │   • PostgreSQL (telemetry, submissions, audit log)               │        │
│  │   • Redis (hot cache: live location, today's node score)         │        │
│  │   • IPFS/Arweave (screenshot hashes, VIN photos)                 │        │
│  │   • Worker (daily hash compute, weekly distribution trigger)     │        │
│  └──────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Responsibility Matrix

| Concern | `frontend noc id` (Drive / Work) | `frontend nemesis` (Protocol) |
|---|---|---|
| GPS trip logging (driver-facing) | ✅ | — |
| Daily activity hash submission UI | ✅ (driver) | — |
| Driver revenue submission form | ✅ | — |
| Maintenance trigger alert | ✅ (driver + workshop) | — |
| Workshop service record anchoring | ✅ (workshop) | — |
| Node score display (personal) | ✅ (driver) | — |
| Node score display (fleet aggregate) | — | ✅ (operator + investor) |
| Landing page (umbrella) | — | ✅ |
| Landing page (Drive/Work onboarding) | ✅ | — |
| Investor marketplace | — | ✅ |
| Share token minting per vehicle | — | ✅ (operator triggers) |
| Fleet onboarding wizard | — | ✅ (operator) |
| Fleet monitoring dashboard | — | ✅ (operator) |
| Yield distribution UI | — | ✅ (investor) |
| $NMS staking / governance | — | ✅ |
| Protocol params / config | — | ✅ (super admin) |
| Revenue submission review queue | — | ✅ (operator) |
| Dispute resolution (admin side) | — | ✅ (super admin) |
| Workshop booking queue | ✅ | — |
| Part catalog / invoicing | ✅ (workshop) | — |
| Public PoA explorer | — | ✅ |

### 3.3 Data Flow: GPS → Hash → Explorer

```
[Vehicle GPS device]  ──MQTT──►  [GPS ingest svc]
                                        │
                                        ▼
                                  [Postgres raw]
                                        │
                                        ▼
              ┌──────────[Daily aggregate worker (cron 00:15 UTC+7)]──────────┐
              │                                                               │
              │   Computes: trips, km, active_hours, route_hash               │
              │   Writes:   daily_summaries row                               │
              │   Emits:    poa_commit(vehicle, date, hash32) ──► Anchor      │
              │                                                               │
              └───────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              [Solana: proof-of-activity]
                                        │
                      ┌─────────────────┼─────────────────┐
                      ▼                 ▼                 ▼
             [Nemesis Drive:    [Nemesis Protocol:   [Nemesis Protocol:
              /drive/gps-live    /explorer (public)   /operator/fleet (ops)
              shows my score]    shows anyone's]      shows aggregate]
```

### 3.4 Division Rationale

Two apps, one protocol. The split is not cosmetic — it reflects three underlying truths:

1. **Physical context differs.** Drivers use mobile outdoors under sunlight (light theme, large tap targets, glanceable). Investors use desktop indoors in long thinking sessions (light theme for low-focus browsing, or dark for operator/admin long-focus ops).
2. **Trust boundary differs.** Drivers/workshops submit data. Operators/admins validate data. Investors consume validated data. Mixing these UIs would blur the "who can modify what" boundary.
3. **Deployment cadence differs.** Driver app ships weekly (bug fixes, UX polish). Operator/admin portal ships monthly (workflow changes). Investor portal ships quarterly (feature drops). Separate apps = separate release trains.

---

## 4. User Personas & Journeys

### 4.1 P1 — Driver (Budi, 32, Jakarta, Gojek ojol driver)

**Context:** Rides electric motorcycle 8-10h/day. Smartphone is mid-range Android (Redmi/Samsung A-series). Data plan 5-10GB/month. Comfortable with Gojek/Grab app flows, not comfortable with crypto jargon.

**Goals:**
- Get assigned an EV, earn more than petrol ojol.
- Submit daily earnings in <2 minutes.
- Know when bike needs service without manually checking.
- See take-home IDRX in Phantom, withdraw via IDRX off-ramp.

**Primary flow:**

```
Day start → open Nemesis Drive → "Start Trip" → (app collects GPS in background)
  → work all day on Gojek as normal
Day end → open Nemesis Drive → "Submit Earnings"
  → input gross IDR + upload Gojek screenshot
  → see "Activity OK ✓  Revenue within expected band ✓  Auto-approved"
  → receive 70% share as IDRX in wallet instantly
Week end → see weekly node score, next bonus tier, maintenance countdown
```

**Theme:** LIGHT (outdoor readability, high contrast, large touch targets, mobile-first).

**Wireframe notes:**
- Home = 1 primary action ("Start Trip" or "Submit Earnings" depending on day state)
- Node score ring always visible at top
- KM to next maintenance = secondary widget
- History = flat list, scroll-to-load
- Wallet balance IDRX = header chip, tap to expand

### 4.2 P2 — Workshop / Bengkel (Pak Hendra, 45, Bekasi, owns small EV service shop)

**Context:** Desktop-based workflow. 2-3 mechanics. Currently uses WhatsApp + spreadsheet for bookings. Understands invoices, not crypto. Wants steady high-value customers.

**Goals:**
- Receive Nemesis-routed service bookings with pre-filled VIN + maintenance trigger.
- Scan vehicle, perform service, log parts used, submit proof of service on-chain.
- Get paid in IDRX per invoice from Maintenance Fund.
- Build reputation (workshop node score) to attract more bookings.

**Primary flow:**

```
Boot desktop → Nemesis Work → Booking Queue
  → see "Booking #381 — Honda EV-R3 — 5,000km service — trigger by proof-of-activity"
  → accept → driver arrives → scan VIN (camera)
  → perform service → input parts used (from catalog) → photo of odometer
  → "Submit Proof of Service" → signed tx to Anchor → Maintenance Fund releases IDRX
  → invoice auto-generated → PDF export
End of day → reputation dashboard, earnings, upcoming bookings
```

**Theme:** DARK (desktop indoor long sessions, reduce eye strain during parts-catalog scanning).

### 4.3 P3 — Investor (Sarah, 28, Jakarta, young professional, first-time RWA investor)

**Context:** Has Phantom wallet from a prior NFT mint. Holds some IDRX from a previous campaign. Wants Rupiah yield better than deposito (6-7%) but less scary than unknown DeFi.

**Goals:**
- Browse active fleet pools, pick one by APY + risk (node score avg, utilization %).
- Buy shares with IDRX (UX: like e-commerce checkout, not like Uniswap swap).
- Track weekly yield landing in wallet.
- Optionally stake $NMS for boosted yield (1.5x / 2x tiers).

**Primary flow:**

```
nemesis.id → "Invest" → /marketplace
  → filters: min APY, min node score, max ticket size
  → select Fleet Pool #7 (Jakarta Ojol EV, 42 units, avg score 81, base APY 34%)
  → /invest/7 → see fleet detail, history, health
  → "Buy 10 shares" → sign tx in Phantom → shares in wallet, confirmation screen
Every Monday → Phantom notif: "You received 4,230 IDRX yield from Fleet Pool #7"
Portfolio page → chart of cumulative yield, per-pool breakdown, claim / compound
Optional: /stake → lock $NMS for 90d tier → APY booster applies to all holdings
```

**Theme:** LIGHT (low-focus glanceable, consumer shopping aesthetic, not trader dashboard aesthetic).

### 4.4 P4 — Operator (Andi, 38, CEO of a 200-motor EV fleet company)

**Context:** Already owns and operates a fleet of electric motorcycles leased to ojol drivers. Today manages via spreadsheets + WhatsApp groups. Wants capital to scale from 200 → 1,000 units without dilution from equity investors or banking covenants.

**Goals:**
- List their fleet on Nemesis → each vehicle gets 1,000 SPL shares → sell shares to investors → receive IDRX for fleet growth.
- Monitor every unit's activity, revenue, maintenance status from one dashboard.
- Assign / reassign drivers to vehicles.
- Review flagged revenue submissions in 24h SLA.
- Approve scheduled maintenance.
- Read weekly distribution reports.

**Primary flow:**

```
Onboarding (one-time):
  /operator/onboard → KYB → upload fleet list (CSV: VIN, model, purchase date, current driver)
  → per-vehicle mint ceremony (batch) → each vehicle gets SPL share contract
  → shares available in /marketplace after operator sets price curve

Daily:
  /operator → KPI dashboard (uptime, revenue, flagged subs, pending maintenance)
  /operator/revenue → review queue (sorted by oldest PENDING_REVIEW)
                      → click submission → see GPS map + screenshot + inferred band
                      → Approve / Reject / Partial approve
  /operator/fleet → map view, table view, per-unit drilldown
  /operator/drivers → assign/reassign, view driver node scores
  /operator/maintenance → approve workshop bookings

Weekly:
  /operator/analytics → KPI trend, churn, top/bottom performers
```

**Theme:** DARK (long ops session, 8-10h window staring at data, reduce eye strain).

### 4.5 P5 — Super Admin (Nemesis internal team member)

**Context:** Core team engineer or ops lead. Has a dedicated hardware wallet key. Responsible for platform parameters, dispute resolution, treasury management.

**Goals:**
- View protocol-wide KPIs (TVL, ARR, buyback pace, operator count, fleet count).
- Approve / suspend operators.
- Tune protocol parameters (revenue split %, APY booster tiers, correction factor for revenue band, avg_fare table per region).
- Resolve escalated disputes (driver ↔ operator, investor ↔ operator, workshop ↔ operator).
- Monitor treasury, trigger $NMS buyback operations.
- Audit every admin action (the admin can't hide from the admin log).

**Primary flow:**

```
Login → hardware wallet signature challenge
/admin → protocol KPI top row
/admin/operators → approve pending operator apps, suspend misbehaving ones
/admin/fleets → global registry, cross-operator search
/admin/params → tune correction_factor, avg_fare per city, APY tiers (MUST multi-sig in Phase 2+)
/admin/disputes → escalated cases, view full trail, issue ruling
/admin/treasury → buyback history, treasury holdings, next scheduled ops
/admin/governance → active $NMS proposals, voting results (read-only until Phase 3)
/admin/audit → every admin action timestamped + signed
```

**Theme:** DARK (long governance session, serious tone).

---

## 5. Nemesis Drive & Work Module PRD

Housed in `frontend noc id`. Scope: Proof of Activity only. Users: driver, workshop. No investor surfaces, no minting, no governance.

### 5.1 Scope & Non-Scope

**In scope:**
- Driver GPS collection, trip logging, daily hash submission
- Daily revenue submission (form + screenshot upload)
- Node score display (personal)
- Maintenance alert (km-based trigger)
- Workshop booking queue, scan, service logging, proof-of-service submission
- Parts catalog, invoice generation
- Shared: onboarding landing for "join as driver" / "join as workshop partner"

**Out of scope (belongs in `frontend nemesis`):**
- Anything investor-facing (marketplace, portfolio, explorer)
- Anything tokenization-facing (mint flows, share pricing)
- Anything governance-facing ($NMS staking, proposals, treasury)
- Fleet-wide monitoring (belongs to operator portal)
- Protocol parameter configuration

### 5.2 Landing Onboarding (`/`)

**Target audience:** Driver candidate (looking for a bike), workshop owner candidate (looking for new customer stream).

**Theme:** LIGHT.

**Sections:**

1. **Hero (split):**
   - Left column (Driver): "Jadikan Motor Listrikmu Menghasilkan — Tiap trip terverifikasi, tiap rupiah langsung masuk." CTA → "Daftar Jadi Driver".
   - Right column (Workshop): "Jadi Bengkel Mitra Nemesis — Dapat booking otomatis, dibayar dari Maintenance Fund on-chain." CTA → "Daftar Jadi Bengkel".

2. **How it works (driver path):** 3 steps with icons (Join → Ride → Earn daily in IDRX).

3. **How it works (workshop path):** 3 steps (Register → Receive Booking → Earn per invoice).

4. **Earnings calculator (driver):** Input estimated daily gross earnings (Rp 150k–300k) → see estimated take-home, monthly IDRX, node score bonus tier.

5. **Testimonials / Pilot proof** (post-Phase 1).

6. **Download / Register CTAs** (sticky footer on mobile).

7. **FAQ:** "Apakah saya butuh Phantom wallet?" "Apakah uang saya aman?" "Bagaimana kalau saya libur?"

**Copy rule:** Zero crypto jargon. Never say "on-chain" or "tokenized" on this page. Say "terverifikasi", "langsung masuk rekening digital", "tidak bisa dipotong".

### 5.3 Nemesis Drive (Driver App) — `/drive/*`

Route-by-route specification. All routes under `/drive/*` are authenticated (Phantom signature) and mobile-first.

#### 5.3.1 `/drive` — Home

**Primary widget:** Big circular node score (0-100) with tier label (Bronze/Silver/Gold/Platinum).

**State-dependent CTA (single primary button):**
- If today has no trip log yet → "Start Day" (enables GPS)
- If day is active → "End Day" (stops GPS, prompts revenue submit)
- If day ended, no revenue submitted → "Submit Earnings" (primary red)
- If revenue submitted, awaiting anchor → "Anchoring... ✓" (disabled spinner)
- If anchored → "See Today's Payout" (chevron)

**Secondary widgets:**
- Today's KM, trips, active hours
- Next service: "3,240 km remaining to 10,000 km service"
- Wallet balance (IDRX) as pill

#### 5.3.2 `/drive/timeline` — Trip History

Flat list of days. Each day row: date, total KM, trips, gross IDR, status badge (ANCHORED / PENDING / REJECTED). Tap → `/drive/timeline/[date]`.

#### 5.3.3 `/drive/timeline/[date]` — Day Detail

- Map preview of the day's route (polyline)
- Trip-by-trip table (start, end, distance, duration)
- Revenue submission card (status, amount, band check)
- Link to on-chain tx (Solscan)

#### 5.3.4 `/drive/revenue` — Revenue Submission ⭐ **NEW**

Form:
- Date (pre-filled = today, if day already ended)
- Gross IDR input (numeric keypad)
- Screenshot upload (camera + gallery), OR "Connect Gojek/Grab account" in Phase 2
- Expected band preview: "Based on your GPS (58 km, 23 trips, 7h active), expected range: Rp 180k - Rp 260k"
- Submit button → shows result: "AUTO-APPROVED" (green) or "PENDING REVIEW" (yellow, "operator will review within 24h").

#### 5.3.5 `/drive/node-score` — Node Score Detail ⭐ **NEW**

- Score breakdown: activity (40%), revenue consistency (30%), maintenance compliance (20%), reputation history (10%)
- 90-day trend chart
- Tier bonus visualization: current tier → next tier progress
- Actions that affect score (green: +, red: -)

#### 5.3.6 `/drive/gps-live` — Live GPS ⭐ **NEW**

Real-time map view. Shows:
- Current position + heading
- Today's polyline
- Active session timer
- Cumulative KM today
- "Stop GPS" button (admin-style confirmation)

#### 5.3.7 `/drive/maintenance` — Maintenance ⭐ **NEW**

- Next trigger: 2,500km / 5,000km / 10,000km
- Countdown widget (km remaining)
- Recommended workshops (nearest, highest reputation)
- "Book Now" → opens workshop selection
- History: past services with on-chain proof link

#### 5.3.8 `/drive/identity` — Identity / Vehicle

- VIN, model, photo, registration dates
- Operator (company owning the vehicle)
- Share token info (public — driver can see who owns their bike's shares, aggregate)
- Driver profile (name, wallet, joined date)

#### 5.3.9 `/drive/book` — Booking Workshop

- Search workshops (map + list)
- Select workshop → select service → confirm
- Status tracking: REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED

#### 5.3.10 `/drive/notifications` — Notifications

Push-driven list. Types: maintenance due, revenue approved, revenue rejected (with reason), yield milestone, node score tier change.

**Mobile-first design rules:**
- Minimum tap target 44×44
- Bottom nav (5 items): Home / Timeline / Revenue / Score / Profile
- All scroll lists are virtualized
- Dark-mode opt-in in settings (default: light)
- Offline mode: cache today's summary, queue submissions to send on reconnect
- Haptic feedback on key actions

**Light palette:**
- Background: `#F7F8FB` (very light gray)
- Surface: `#FFFFFF`
- Primary: `#0B5FFF` (Nemesis blue)
- Success: `#16A34A`
- Warning: `#F59E0B`
- Danger: `#DC2626`
- Text primary: `#0F172A`
- Text muted: `#64748B`

### 5.4 Nemesis Work (Workshop App) — `/work/*`

Route-by-route specification. All routes under `/work/*` are authenticated and desktop-first.

#### 5.4.1 `/work` — Dashboard

Top KPI row: bookings today, bookings this week, parts stock low, reputation score.
Main panel: today's booking queue (timeline view).
Right sidebar: urgent maintenance triggers nearby (geo-sorted, workshop can proactively reach out).

#### 5.4.2 `/work/scan` — Vehicle Scan

Camera view for VIN scan. On scan:
- Validates VIN against on-chain registry
- Shows vehicle info, current KM, active maintenance triggers
- "Start Service" button → transitions booking to IN_PROGRESS

#### 5.4.3 `/work/bookings` — Booking List

All bookings with filters (status, date range, driver, service type).

#### 5.4.4 `/work/queue` — Live Queue

Kanban: REQUESTED / ACCEPTED / IN_PROGRESS / COMPLETED. Drag-drop to progress.

#### 5.4.5 `/work/viewer/[vin]` — Vehicle Viewer

3D model (if available) + telemetry view + service history. Reuses existing 3D components.

#### 5.4.6 `/work/history` — Service History

Searchable log of all services performed. Columns: date, VIN, service type, parts, total, status, tx link.

#### 5.4.7 `/work/maintenance` — Maintenance Triggers Map

Geographic heatmap of pending maintenance triggers in workshop's service radius.

#### 5.4.8 `/work/maintenance-proof` — Submit Proof of Service ⭐ **NEW**

Form:
- Select active booking
- Parts used (multi-select from catalog, quantity each)
- Labor hours
- Photos (before, during, after) — uploaded to IPFS
- Final odometer reading
- Notes
- "Submit Proof" → signs Anchor tx → Maintenance Fund releases IDRX to workshop wallet
- Invoice PDF auto-generated

#### 5.4.9 `/work/analytics` — Workshop Analytics

Revenue trends, service type mix, customer repeat rate.

#### 5.4.10 `/work/reputation` — Reputation

Workshop node score (separate from driver score, 0-100). Factors: on-time completion, price vs benchmark, customer satisfaction, zero-dispute rate. Tier badges.

#### 5.4.11 `/work/notifications` — Notifications

New bookings, parts reorder, rating received, dispute opened.

#### 5.4.12 `/work/verification` — KYB / Verification

Workshop ownership verification documents.

**Theme: DARK (unchanged from existing).**

**Dark palette:**
- Background: `#0B0F17`
- Surface: `#141A23`
- Surface elevated: `#1C2430`
- Primary: `#3B82F6`
- Text primary: `#E2E8F0`
- Text muted: `#94A3B8`
- Border: `#1E293B`

### 5.5 Shared Components & State (within `frontend noc id`)

**Shared UI components:**
- `ConnectWalletButton` (Phantom adapter)
- `PaymentModal` (IDRX transfer flow)
- `Toast` (notification system)
- `LeafletMap` (location picker)
- `3D viewer` (car/motorcycle models — reused)
- `SharedServiceCard`, `SharedNotificationCard`

**Shared state:**
- `BookingStore` (Zustand) — driver's active booking, workshop's queue
- `BookingContext` — booking lifecycle state machine
- `ActiveVehicleContext` — current vehicle (for driver)
- `PartCatalogContext` — parts catalog (for workshop)
- `Providers` — trimmed to driver + workshop only (no admin/enterprise/copilot providers)

---

## 6. NEMESIS Protocol Module PRD

Housed in `frontend nemesis`. Scope: landing, investor, operator, super admin.

### 6.1 Main Landing Page (`/`)

**Target:** Investor candidate, operator candidate (fleet owner), ecosystem visitor, partner.

**Theme:** LIGHT.

**Wireframe sections:**

#### 6.1.1 Hero

Headline: **"Tokenized EV Infrastructure — Own a Share of Indonesia's Electric Future."**
Sub: "Fractional shares of real revenue-generating EV fleets. Settled in IDRX on Solana. Proven by GPS, verified by code."
CTAs (three): "Invest Now" → /marketplace. "Onboard Fleet" → operator signup. "Read Pitch" → PDF download.
Visual: animated 3-layer stack (Asset / Activity / Revenue) with subtle parallax.

#### 6.1.2 Problem

3 cards: "Drivers can't afford EVs", "Operators hit capex walls at scale", "Retail investors lack Rupiah yield exposure".

#### 6.1.3 Solution — 3 Layers

Interactive vertical diagram:
- **Layer 1 (Asset):** SPL share tokens. 1 vehicle = 1,000 shares. Share price = vehicle value / 1,000.
- **Layer 2 (Activity):** GPS proof, daily anchor, node score 0-100.
- **Layer 3 (Revenue):** On-chain split 70/20/7/3. Weekly distribution.

Each layer has a micro-demo or illustration.

#### 6.1.4 How It Works

For each persona (Investor, Operator, Driver) — 4 swim-lane cards.

#### 6.1.5 Module Scope Table

| Module | Scope | Phase |
|---|---|---|
| M1 Productive EV | Motorcycles, cars, vans, trucks, buses | Ship now |
| M2 EV Charging | Smart charging stations | Phase 4 |
| M3 Solar + EV | Integrated solar charging microgrids | Phase 5 |
| M4 Data Marketplace | Aggregated mobility data (anonymized) | Phase 3 beta |
| M5 Regional Expansion | Vietnam, Philippines, Thailand | Phase 6 |

#### 6.1.6 Numbers

4-6 large stat cards: Target TVL 12mo, Target units, APY range (30–41.6%), Share price reference.

#### 6.1.7 Competitive

2×3 comparison grid: NEMESIS vs Traditional fleet equity vs P2P lending vs ETF. Rows: Fractional, On-chain transparency, Rupiah yield, Physical backing, Secondary market.

#### 6.1.8 Tokenomics Summary

$NMS: 100M supply, distribution pie, utility list (governance, yield boost, fee discount).
IDRX: settlement currency, OJK-aligned.

#### 6.1.9 Team & Backers

Avatars + bios + LinkedIn links. Logos of confirmed partners.

#### 6.1.10 Final CTA + Newsletter

"Ready to Own the Road?" — big CTA to marketplace. Newsletter opt-in. Footer with docs / whitepaper / GitHub.

### 6.2 Investor Portal

All routes LIGHT theme.

#### 6.2.1 `/marketplace` — Fleet Pool Browse

- Filter bar: sort by APY ↓, utilization ↓, node score avg ↓, price range
- Grid of fleet pool cards
- Each card: fleet name, vehicle type, region, live utilization %, avg node score, current APY, shares available, min ticket
- Badge: "New", "High Demand", "Limited"

#### 6.2.2 `/invest/[fleetId]` — Fleet Detail

- Header: name, operator, total vehicles, TVL, APY
- Tabs:
  - **Overview:** description, strategy, operator profile
  - **Live:** map of active vehicles (dots on map, color = node score)
  - **Financials:** historical weekly distribution chart, revenue trend
  - **Vehicles:** table of all units (VIN, model, driver, score, uptime)
  - **Governance:** operator-proposed param changes
- Right sticky panel: "Buy Shares" widget — amount (IDRX), shares received preview, total cost, gas, signer prompt
- Mobile: sticky bottom bar

#### 6.2.3 `/portfolio` — Investor Dashboard

- Top row: Total TVL, Unrealized yield, $NMS staked, Booster tier
- Per-fleet breakdown (shares owned, yield MTD/YTD, current APY, actions: Claim / Compound / Sell [Phase 3])
- Yield chart (area, 90d)
- Activity feed

#### 6.2.4 `/portfolio/transactions` — Transaction Log

All distribution events, all share purchases, all claims. CSV export.

#### 6.2.5 `/explorer` — Public PoA Explorer

- Search by VIN or fleet ID
- Show: daily hash history, GPS route preview (with driver consent, else aggregate only), anchor tx links
- Not authenticated — anyone can verify

#### 6.2.6 `/explorer/[vehicleId]/revenue` — Per-Vehicle Revenue

Historical revenue chart, split breakdown, attach tx links.

#### 6.2.7 `/stake` — $NMS Staking

- Stake amount input
- Lock duration tabs: 30d / 90d / 180d / 365d
- Preview: new booster tier, estimated APY uplift
- Current staked, claim rewards, unstake (subject to cooldown)

### 6.3 Operator Portal

All routes DARK theme.

#### 6.3.1 `/operator` — Dashboard

KPI row: active vehicles, revenue today, flagged submissions pending, maintenance due, weekly distribution preview.
Main panel: fleet map (dots, color = node score).
Side: recent activity feed, alerts.

#### 6.3.2 `/operator/onboard` — Fleet Onboarding

Wizard:
1. KYB company details
2. Upload fleet CSV (template provided)
3. Per-vehicle: photos, VIN validation, odometer
4. Set share pricing curve (bonding curve or fixed per unit)
5. Sign batch mint transaction → SPL share contracts created
6. Confirm listing on marketplace

#### 6.3.3 `/operator/fleet` — Fleet Monitoring

- Switch view: map / list / table
- Per-vehicle drilldown: live location, today's activity, node score, driver assigned, maintenance status
- Bulk actions: reassign driver, flag for service, suspend (reason required)

#### 6.3.4 `/operator/drivers` — Driver Management

- Driver roster (name, wallet, assigned vehicle, score, joined date)
- Assignment manager (drag-drop or select flow)
- Driver KYC status
- Score history per driver

#### 6.3.5 `/operator/revenue` — Revenue Review Queue ⭐ **PoR gate**

- Default filter: PENDING_REVIEW (oldest first)
- SLA countdown per submission (24h window before auto-escalation)
- Click submission → drawer:
  - GPS map of that day
  - Screenshot (IPFS)
  - Inferred band calculation (visible math, not hidden)
  - Historical pattern of this driver (last 30d)
  - Action buttons: Approve / Reject (with reason template) / Partial Approve
- Bulk approve/reject with guard

#### 6.3.6 `/operator/maintenance` — Maintenance Approval

- Pending maintenance triggers fleet-wide
- Workshop recommendations per trigger
- Approve booking → funds escrow from Maintenance Fund
- Service completion verification

#### 6.3.7 `/operator/analytics` — KPI Analytics

Uptime trend, revenue per vehicle per day, churn rate, top/bottom performers, flagged rate over time.

#### 6.3.8 `/operator/settings` — Operator Settings

Profile, wallet management, notification preferences, delegate roles (sub-operators).

### 6.4 Super Admin Portal

All routes DARK theme. Every action is signed + audited.

#### 6.4.1 `/admin` — Protocol Overview

TVL, ARR, fee revenue, buyback volume (7d/30d), active fleets, active drivers, this week's distribution ready?

#### 6.4.2 `/admin/operators` — Operator Registry

Approve pending applications (KYB review), suspend misbehaving operators (reason + notice), operator performance ranking.

#### 6.4.3 `/admin/fleets` — Global Fleet Registry

Every fleet across every operator. Cross-operator search, global stats.

#### 6.4.4 `/admin/params` — Protocol Parameters

Forms to adjust:
- Revenue split %'s (70/20/7/3) — locked in Phase 1, governance-voted Phase 3+
- APY booster tiers per $NMS stake duration
- Maintenance trigger thresholds (km)
- `correction_factor` for Proof of Revenue band
- `avg_fare_low` / `avg_fare_high` per city per service type
- Protocol fee breakdown (4% buyback / 3% fleet ops)

**All param changes require multi-sig + timelock in Phase 2+.**

#### 6.4.5 `/admin/disputes` — Dispute Resolution

Queue of escalated disputes (24h+ without operator action, or driver/investor appeals). Full evidence panel. Admin rules + signs on-chain.

#### 6.4.6 `/admin/treasury` — Treasury

Holdings (IDRX + $NMS + vault LP), buyback history, scheduled next ops, runway calculation.

#### 6.4.7 `/admin/governance` — Governance Board

Active proposals, voting results, execution queue.

#### 6.4.8 `/admin/audit` — Audit Log

Every admin action signed + indexed. Filter by admin, action type, date. Immutable off-chain mirror of on-chain signed ops.

---

## 7. Proof of Activity Layer

Detailed spec for the GPS-based activity proof system that gatekeeps revenue submission and powers node score.

### 7.1 GPS Telemetry Schema

**Raw GPS packet (device → ingest service):**

```typescript
{
  vehicle_id: string;        // from device firmware, tied to VIN
  device_sig: string;        // HMAC of payload with device key
  ts: number;                // unix ms, device clock
  lat: number;               // wgs84
  lon: number;               // wgs84
  alt?: number;              // meters
  speed_kmh: number;
  heading?: number;          // degrees
  battery_pct?: number;      // EV battery
  odo_km?: number;           // cumulative odometer (if device reports)
  hdop: number;              // GPS horizontal dilution of precision
  fix_type: 'none' | '2d' | '3d';
}
```

Cadence: every 10 seconds during an active session, throttled to 60 seconds when stationary (speed < 3 km/h for 2 min).

### 7.2 Trip Segmentation

Off-chain worker groups raw packets into trips:
- Trip start: first packet with speed > 5 km/h after 10+ min of inactivity
- Trip end: speed < 3 km/h sustained for 5 min, or session end
- Min valid trip: ≥500 m distance AND ≥2 min duration

### 7.3 Daily Aggregate Fields

Per vehicle per day (`daily_summaries` table row):

```typescript
{
  vehicle_id: string;
  date: string;              // YYYY-MM-DD (local tz, Asia/Jakarta)
  trip_count: number;
  total_km: number;
  active_hours: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  route_polyline_hash: string; // SHA-256 of concatenated trip polylines
  daily_hash: string;          // SHA-256 of canonical daily summary JSON
  anchor_tx_sig?: string;
  qualifies_for_revenue: boolean;
}
```

**Qualifies for revenue:** `active_hours >= 3 OR total_km >= 20`. If false, driver cannot submit revenue for that day (PoA gate).

### 7.4 Node Score Algorithm

Score is recomputed nightly per vehicle, exponentially weighted over last 90 days. Formula:

```
score = (0.4 × activity_score)
      + (0.3 × revenue_consistency_score)
      + (0.2 × maintenance_compliance_score)
      + (0.1 × reputation_history_score)

activity_score                = clamp100(active_days_l30 / 25 × 100)
revenue_consistency_score     = clamp100(100 - cv(daily_revenue_l30) × 100)
maintenance_compliance_score  = clamp100(100 - overdue_km_l30 / 500 × 100)
reputation_history_score      = clamp100(100 - (rejections_l90 + disputes_l90 × 3) × 5)

where cv = coefficient of variation (stddev / mean)
```

**Tier mapping:**
- Platinum: ≥90
- Gold: 75–89
- Silver: 60–74
- Bronze: 40–59
- Unranked: <40 (revenue submissions always PENDING_REVIEW)

### 7.5 Maintenance Trigger Logic

Each vehicle has configurable trigger schedule. Default for electric motorcycles:

```
2,500 km → tire check + brake inspection (workshop notification, non-blocking)
5,000 km → major service A (battery health check) — must complete within +500km
10,000 km → major service B (motor + bearings) — must complete within +500km
```

Overdue → drop `maintenance_compliance_score` linearly.

### 7.6 On-chain vs Off-chain Data Split

**On-chain (minimized, immutable):**
- Daily hash per vehicle per day
- Revenue submission result (amount, splits, status, tx)
- Maintenance service proof (vin, service type, workshop, tx)
- Node score snapshot weekly (for historical audit)

**Off-chain (detailed, queryable):**
- Raw GPS packets (retained 90d rolling)
- Trip segments (retained 1 year)
- Daily summaries (retained indefinitely)
- Revenue submission details pre-anchor
- Screenshots (IPFS CIDs referenced on-chain in submission)

### 7.7 `proof-of-activity` Anchor Program Sketch

```rust
#[program]
pub mod proof_of_activity {
    use super::*;

    pub fn commit_daily(
        ctx: Context<CommitDaily>,
        date: i64,
        daily_hash: [u8; 32],
        trip_count: u32,
        total_km_x100: u64,
        active_seconds: u32,
    ) -> Result<()> {
        let poa = &mut ctx.accounts.poa_record;
        poa.vehicle = ctx.accounts.vehicle.key();
        poa.date = date;
        poa.daily_hash = daily_hash;
        poa.trip_count = trip_count;
        poa.total_km_x100 = total_km_x100;
        poa.active_seconds = active_seconds;
        poa.committed_by = ctx.accounts.oracle.key();
        poa.timestamp = Clock::get()?.unix_timestamp;
        emit!(DailyCommitted { vehicle: poa.vehicle, date, hash: daily_hash });
        Ok(())
    }
}

#[account]
pub struct PoaRecord {
    pub vehicle: Pubkey,
    pub date: i64,
    pub daily_hash: [u8; 32],
    pub trip_count: u32,
    pub total_km_x100: u64,
    pub active_seconds: u32,
    pub committed_by: Pubkey,  // Nemesis oracle authority
    pub timestamp: i64,
}
```

---

## 8. Proof of Revenue Layer

The revenue layer is where physical earnings enter the on-chain split. This is the protocol's highest-stakes surface because it gates money flow. Three defensive layers ensure submissions are real.

### 8.1 Purpose

Ensure revenue submitted by drivers is real, verifiable, and aligned with their Proof of Activity — before the 70/20/7/3 on-chain split executes. Prevent inflated revenue, ghost vehicles, collusion, and off-platform earnings spoofing.

### 8.2 Three-Layer Architecture

#### Layer 1 — Submission (Nemesis Drive)

**Driver flow:** `/drive/revenue` at end of day.

- Input: gross revenue (IDR).
- **Phase 1 (MVP):** Manual input + mandatory screenshot from Gojek/Grab earnings page. Screenshot → IPFS → CID → referenced on submission.
- **Phase 2:** Gojek/Grab OAuth → auto-pull daily earnings via API. Screenshot becomes optional backup.
- **Phase 3:** Native IDRX rail — customer pays driver directly via QRIS-IDRX. Revenue submission becomes near-unnecessary because earnings are already on-chain.

**Gate:** Submission blocked if PoA for that date has `qualifies_for_revenue = false` (activity threshold not met).

#### Layer 2 — Validation (Off-chain + Smart Contract Pre-check)

Worker picks submission → computes inferred band:

```
inferred_low  = trip_count × avg_fare_low(region, service_type)  × correction_factor
inferred_high = trip_count × avg_fare_high(region, service_type) × correction_factor
tolerance     = ±40% from midpoint (±50% for Gold+ node score)
```

- `avg_fare_low` / `avg_fare_high` maintained per city per service type (ojol / food / express).
- `correction_factor` adjusted by admin via `/admin/params` (default 1.0, tuned monthly based on observed data).
- Node score tier adjusts tolerance: higher trust = wider tolerance.

**Auto-approve path:** Submitted amount within `[inferred_low × 0.6, inferred_high × 1.4]` → status AUTO_APPROVED → proceed to Layer 3.

**Manual review path:** Out of band → status PENDING_REVIEW → queued on `/operator/revenue`. Operator has 24h SLA.

Operator drawer shows:
- GPS map of that day
- Screenshot (IPFS)
- Inferred band math (low, high, midpoint, submitted amount, deviation %)
- Driver's 30-day historical pattern
- Reason-template dropdown for rejection

Operator actions:
- **Approve** → status APPROVED → proceed to Layer 3
- **Reject** → status REJECTED (driver can resubmit with correction one time; second rejection is terminal)
- **Partial Approve** → adjust amount, status APPROVED at adjusted amount
- **Timeout** → after 24h without action → status ESCALATED → routes to super admin

**Rejection impact:**
- Driver node score: -5
- 3× rejection within 30 days → driver flagged, vehicle assignment pause until operator review

#### Layer 3 — Anchoring (Solana On-chain)

Approved submission → hashed (amount + date + vehicle + driver + gps_hash + screenshot_cid) → `proof-of-revenue::submit_revenue` transaction.

Smart contract on success:
1. Stores RevenueSubmission PDA
2. Transfers IDRX splits:
   - 70% → driver's associated token account (ATA)
   - 20% → Fleet Pool vault (this fleet's investor pool)
   - 7% → Protocol Treasury vault (of which 4% accumulates for scheduled buyback, 3% to fleet operator)
   - 3% → Vehicle Maintenance Fund vault (locked until proof of service)
3. Emits `RevenueSubmitted { vehicle, amount, splits, gps_hash, timestamp }`

**Weekly yield distribution (every Monday UTC+7):**
- Cron reads each Fleet Pool vault balance
- Distributes pro-rata to share holders (address book from Mint's associated accounts)
- Events emitted per holder
- Investors receive IDRX in Phantom wallet

### 8.3 State Machine

```
               ┌───────┐
               │ DRAFT │
               └───┬───┘
                   │ submit
                   ▼
             ┌───────────┐
             │ SUBMITTED │
             └─────┬─────┘
                   │ gps correlation check
         ┌─────────┴─────────┐
  within_band              out_of_band
         │                     │
         ▼                     ▼
  ┌───────────────┐      ┌─────────────────┐
  │AUTO_APPROVED  │      │ PENDING_REVIEW  │
  └───────┬───────┘      └────────┬────────┘
          │                       │ operator action within 24h
          │          ┌────────────┼────────────┬──────────┐
          │          │            │            │          │
          │       approve      reject      partial    timeout
          │          │            │            │          │
          │          ▼            ▼            ▼          ▼
          │    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
          │    │ APPROVED │ │ REJECTED │ │ APPROVED │ │ ESCALATED   │
          │    └────┬─────┘ └──────────┘ │(adjusted)│ │ (admin rule)│
          │         │                    └────┬─────┘ └──────┬──────┘
          │         │                         │              │
          │         │   (rejected: driver can │              │
          │         │    resubmit once)       │              │
          │         │                         │              │
          └─────────┴──────────┬──────────────┘              │
                               │                             │
                               ▼                             ▼
                        ┌─────────────┐             ┌───────────────┐
                        │  ANCHORING  │             │   ADMIN_RULE  │
                        └──────┬──────┘             └───────┬───────┘
                               │                            │
                               ▼                            ▼
                        ┌─────────────┐             ┌───────────────┐
                        │  ANCHORED   │             │   ANCHORED    │
                        │ (splits done)│             │ or REJECTED  │
                        └─────────────┘             └───────────────┘
```

### 8.4 Anti-Fraud Vectors

| Attack | Defense |
|---|---|
| Driver inflates revenue number | GPS correlation band (±40%), screenshot anchor, operator review |
| GPS spoofing (drive around fake route) | Speed profile anomaly check (too steady = fake); platform screenshot required; platform-order ID cross-check (Phase 2) |
| Ghost vehicle (parked, fake activity) | PoA gate: ≥3h active OR ≥20km/day required before revenue submission allowed |
| Collusion driver ↔ operator (operator approves inflated) | Random audit by super admin; anomaly detection (outlier vs fleet median); whistleblower channel |
| Driver submits on holiday / no work | PoA gate blocks submission |
| Replay attack (resubmit past day) | `(vehicle, date)` is unique — one submission per day, on-chain enforced |
| Screenshot forgery | IPFS CID ties image, operator visual review; Phase 2 moves to API-backed OAuth making screenshot optional |
| Off-platform rides (cash transaction) | Explicit out of scope Phase 1 — cash-paying rides excluded; Phase 2 onward require digital payment platforms only |
| $NMS sybil farming via node score | Node score caps on tolerance widening; sybil detection on wallet creation clusters |

### 8.5 Data Schemas

#### On-chain `RevenueSubmission` PDA

```rust
#[account]
pub struct RevenueSubmission {
    pub vehicle: Pubkey,           // vehicle this revenue belongs to
    pub driver: Pubkey,            // driver wallet
    pub date: i64,                 // unix day (start of day UTC+7)
    pub gross_amount_idrx: u64,    // gross revenue in IDRX smallest unit
    pub gps_hash: [u8; 32],        // ties to PoA daily hash
    pub screenshot_hash: [u8; 32], // IPFS CID hash
    pub status: SubmissionStatus,
    pub reviewed_by: Option<Pubkey>,
    pub review_note: [u8; 128],    // bounded reason
    pub splits: RevenueSplits,
    pub submitted_at: i64,
    pub anchored_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SubmissionStatus {
    Submitted,
    AutoApproved,
    PendingReview,
    Approved,
    Rejected,
    Escalated,
    Anchored,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct RevenueSplits {
    pub driver_idrx: u64,          // 70%
    pub investor_idrx: u64,        // 20%
    pub protocol_idrx: u64,        //  7%
    pub maintenance_idrx: u64,     //  3%
}
```

#### Off-chain `revenue_submissions_pending` table

```sql
CREATE TABLE revenue_submissions_pending (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id         TEXT NOT NULL REFERENCES vehicles(id),
  driver_wallet      TEXT NOT NULL,
  submission_date    DATE NOT NULL,
  gross_idr          BIGINT NOT NULL,
  gps_daily_hash     TEXT NOT NULL,
  screenshot_cid     TEXT,
  inferred_low       BIGINT NOT NULL,
  inferred_high      BIGINT NOT NULL,
  correction_factor  NUMERIC(5,3) NOT NULL,
  status             TEXT NOT NULL CHECK (status IN (
                        'submitted','auto_approved','pending_review',
                        'approved','rejected','escalated','anchored'
                     )),
  review_note        TEXT,
  reviewed_by        TEXT,
  reviewed_at        TIMESTAMPTZ,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anchored_tx_sig    TEXT,
  anchored_at        TIMESTAMPTZ,
  UNIQUE (vehicle_id, submission_date)
);

CREATE INDEX idx_revsub_status_date ON revenue_submissions_pending (status, submission_date);
CREATE INDEX idx_revsub_driver ON revenue_submissions_pending (driver_wallet);
```

### 8.6 UI Touchpoints Summary

| Persona | Route | Purpose |
|---|---|---|
| Driver | `/drive/revenue` | Submit form |
| Driver | `/drive/revenue/[date]` | Status + GPS correlation viz |
| Operator | `/operator/revenue` | PENDING_REVIEW queue, 24h SLA |
| Operator | `/operator/revenue/[id]` | Review drawer: GPS, screenshot, band, actions |
| Investor | `/portfolio/transactions` | Aggregate incoming revenue to pool |
| Investor | `/explorer/[vehicleId]/revenue` | Historical chart, read-only |
| Super Admin | `/admin/audit` | Revenue-related audit trail |
| Super Admin | `/admin/params` | Tune correction_factor + avg_fare table |
| Super Admin | `/admin/disputes` | Escalated submissions |

---

## 9. Design System & Theming Rules

### 9.1 Theme Matrix (Persona × Surface)

| Surface | Persona | Theme | Rationale |
|---|---|---|---|
| `/` (nemesis landing) | Visitor | LIGHT | Marketing, low cognitive load |
| `/marketplace` | Investor | LIGHT | Shopping aesthetic, glanceable |
| `/invest/[id]` | Investor | LIGHT | Info-dense but consumer-oriented |
| `/portfolio` | Investor | LIGHT | Daily check-in, non-trading |
| `/explorer` | Public | LIGHT | Public info, trust signal |
| `/operator/*` | Operator | DARK | 8h+ ops session, eye strain reduction |
| `/admin/*` | Admin | DARK | Governance gravitas, focus |
| `/` (noc id landing) | Driver/Workshop cand. | LIGHT | Onboarding, low cognitive load |
| `/drive/*` | Driver | LIGHT | Outdoor mobile readability |
| `/work/*` | Workshop | DARK | Desktop indoor long session |

### 9.2 Light Palette (Nemesis Core)

```
Background base     #F7F8FB
Background raised   #FFFFFF
Primary 500         #0B5FFF     /* Nemesis blue */
Primary 600         #0A4DCC     /* hover */
Accent mint         #14B8A6
Success             #16A34A
Warning             #F59E0B
Danger              #DC2626
Text primary        #0F172A
Text secondary      #334155
Text muted          #64748B
Border subtle       #E2E8F0
Border strong       #CBD5E1
```

### 9.3 Dark Palette

```
Background base     #0B0F17
Surface             #141A23
Surface elevated    #1C2430
Primary 400         #3B82F6
Primary 500         #2563EB
Accent mint         #2DD4BF
Success             #22C55E
Warning             #FBBF24
Danger              #F87171
Text primary        #E2E8F0
Text secondary      #94A3B8
Text muted          #64748B
Border subtle       #1E293B
Border strong       #334155
```

### 9.4 Typography

- Display: Inter Variable, 44-64 px hero
- H1: Inter Semibold 32 / 36
- H2: Inter Semibold 24 / 28
- H3: Inter Medium 18 / 22
- Body: Inter Regular 14 / 20 (default) or 16 / 24 (forms)
- Mono: JetBrains Mono (addresses, tx sigs, hashes)

### 9.5 Spacing & Motion

- Base: 4px grid. Tailwind defaults apply.
- Motion primitives: `ease-out-soft` (cubic-bezier(.2,.65,.3,1)) for all transitions; 180ms micro, 280ms panels, 420ms page.
- Respect `prefers-reduced-motion` — strip parallax + animated charts.

### 9.6 Accessibility

- WCAG AA contrast minimum everywhere; AAA for primary CTAs.
- Keyboard nav complete on every page (no mouse-only flows).
- Focus ring visible — 2px offset, accent color.
- Form fields always have label + describedby for error.
- Screen-reader labels for icon-only buttons.

### 9.7 Component Library Rules

- **Primitives** shared across apps: Button, Input, Select, Tabs, Dialog, Drawer, Toast, Badge, Card.
- **Domain components** app-scoped: `RevenueSubmitForm` only in `frontend noc id`. `MarketplaceFleetCard` only in `frontend nemesis`.
- Each primitive ships typescript interface + a11y test + visual regression snapshot.
- No inline styles; Tailwind + CSS variables only.
- No third-party UI kit (Radix OK for unstyled primitives, but styling is ours).

---

## 10. Tech Stack & Infrastructure

### 10.1 Frontend

- **Framework:** Next.js 16 App Router, React 19
- **Language:** TypeScript strict (`noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`)
- **Styling:** Tailwind 4 (CSS-first config), CSS variables for theme tokens
- **State:** Zustand (domain stores), Tanstack Query (server state cache)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts (investor), ECharts (operator dense analytics)
- **Maps:** Leaflet + OSM (driver/workshop), MapLibre GL (operator fleet)
- **3D:** Three.js + React Three Fiber (workshop viewer; drop for driver mobile if perf doesn't meet budget)
- **Wallet:** `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-phantom`, `@solana/wallet-adapter-solflare`
- **i18n:** `next-intl` — ID (primary) + EN (secondary)
- **Package manager:** `pnpm` (workspace ready for future `@nemesis/ui` shared package)

### 10.2 Blockchain

- **Chain:** Solana mainnet-beta (devnet for Phase 0-1)
- **Framework:** Anchor 0.30+
- **Tokens:** SPL Token for share mints + $NMS; IDRX is external SPL
- **RPC:** Helius (primary), Triton One (backup)
- **Indexer:** Helius Enhanced + custom consumer into PostgreSQL

### 10.3 Off-Chain Services

- **GPS Ingest:** Rust (axum) or Node.js (fastify). MQTT broker (Mosquitto/EMQX) for device uplink; HTTPS fallback for low-spec devices.
- **Database:** PostgreSQL 16 (primary); read replica for analytics.
- **Cache:** Redis 7 (hot location, today's score, session tokens).
- **File storage:** IPFS (pinning via Pinata) for screenshots, VIN photos, service photos. Arweave for long-term permanent storage of daily hashes.
- **Workers:** BullMQ for cron (daily aggregate, weekly distribution, maintenance trigger notification).
- **Monitoring:** Sentry (errors), Axiom or Grafana (metrics), Solana Beach/Solscan for tx monitoring.

### 10.4 Auth

- **Pattern:** Sign-in with Solana (SIWS) — server issues challenge nonce, wallet signs, server verifies signature → JWT with short TTL + refresh.
- **Session:** HTTP-only refresh cookie, access token in memory.
- **Hardware wallet:** Required for super admin operations (Ledger integration via wallet-adapter).

### 10.5 Hosting / Deploy

- **Frontend:** Vercel (both apps, separate projects sharing team).
- **Backend services:** Railway or Fly.io for GPS ingest + workers.
- **Database:** Neon (Postgres serverless) or Supabase in Phase 1; self-hosted on AWS RDS by Phase 2.
- **CDN:** Cloudflare for static assets + image resize.
- **CI/CD:** GitHub Actions. Lint + typecheck + unit tests on PR. E2E (Playwright) on merge. Preview deploys per PR.

### 10.6 Observability & Ops

- Structured logging (pino) JSON format → log aggregator.
- Every Anchor tx logged with correlation ID tying UI action → API call → tx signature.
- On-call rotation Phase 1 onward; PagerDuty integration.
- Status page (`status.nemesis.id`) public from Phase 1.

---

## 11. Data Model

### 11.1 On-Chain Accounts (Anchor)

#### Vehicle

```rust
#[account]
pub struct Vehicle {
    pub vin: [u8; 17],
    pub model_id: u32,               // lookup into off-chain catalog
    pub operator: Pubkey,
    pub fleet_pool: Pubkey,
    pub share_mint: Pubkey,          // SPL mint for this vehicle's shares
    pub maintenance_vault: Pubkey,
    pub registered_at: i64,
    pub status: VehicleStatus,       // Active / Retired / Suspended
    pub last_poa_date: i64,
}
```

#### FleetPool

```rust
#[account]
pub struct FleetPool {
    pub operator: Pubkey,
    pub name: [u8; 64],
    pub region_code: u16,
    pub vehicle_count: u32,
    pub investor_vault: Pubkey,      // accumulates 20% splits
    pub created_at: i64,
    pub tvl_idrx: u64,               // informational, recomputed
}
```

#### ShareMint (standard SPL Mint)

- Per vehicle, 1,000 supply, 6 decimals (so a "share" is 1,000,000 base units but displayed as 1.0 share).
- Mint authority held by `share-mint` program PDA, freeze authority null post-mint.

#### DriverNode

```rust
#[account]
pub struct DriverNode {
    pub wallet: Pubkey,
    pub assigned_vehicle: Option<Pubkey>,
    pub operator: Pubkey,
    pub score_x100: u32,             // 0-10000 (2 decimal precision)
    pub tier: NodeTier,
    pub activated_at: i64,
    pub suspended_until: Option<i64>,
}
```

#### RevenueSubmission

See §8.5.

#### MaintenanceRecord

```rust
#[account]
pub struct MaintenanceRecord {
    pub vehicle: Pubkey,
    pub workshop: Pubkey,
    pub service_type: ServiceType,   // Routine2500, Major5000, Major10000, Repair
    pub odometer_km: u64,
    pub parts_hash: [u8; 32],        // hash of parts list JSON
    pub photos_cid: [u8; 46],        // IPFS CID v1
    pub amount_idrx: u64,            // released from maintenance vault
    pub completed_at: i64,
    pub tx: [u8; 64],
}
```

#### YieldDistribution

```rust
#[account]
pub struct YieldDistribution {
    pub fleet_pool: Pubkey,
    pub week_start: i64,
    pub total_idrx_distributed: u64,
    pub unique_holders: u32,
    pub merkle_root: [u8; 32],       // for sparse holder proof
    pub executed_at: i64,
}
```

#### $NMS Governance

```rust
#[account]
pub struct NmsStake {
    pub owner: Pubkey,
    pub amount: u64,
    pub lock_duration_days: u16,     // 30 / 90 / 180 / 365
    pub unlock_at: i64,
    pub booster_tier: u8,            // 0 / 1 / 2 (1.0x / 1.5x / 2x yield)
}
```

### 11.2 Off-Chain Tables (PostgreSQL)

```sql
-- Vehicle registry (mirror + metadata)
CREATE TABLE vehicles (
  id                UUID PRIMARY KEY,
  vin               TEXT UNIQUE NOT NULL,
  model_id          INT NOT NULL REFERENCES vehicle_models(id),
  operator_id       UUID NOT NULL REFERENCES operators(id),
  fleet_pool_id     UUID NOT NULL REFERENCES fleet_pools(id),
  onchain_pubkey    TEXT NOT NULL,
  share_mint        TEXT NOT NULL,
  status            TEXT NOT NULL,
  photos_cid        TEXT[],
  registered_at     TIMESTAMPTZ NOT NULL,
  retired_at        TIMESTAMPTZ
);

-- GPS raw (high volume; partitioned by day)
CREATE TABLE gps_telemetry (
  vehicle_id UUID, ts TIMESTAMPTZ, lat DOUBLE PRECISION, lon DOUBLE PRECISION,
  speed_kmh REAL, heading REAL, battery_pct REAL, odo_km DOUBLE PRECISION,
  hdop REAL, device_sig TEXT,
  PRIMARY KEY (vehicle_id, ts)
) PARTITION BY RANGE (ts);

-- Trip segments
CREATE TABLE trip_logs (
  id               UUID PRIMARY KEY,
  vehicle_id       UUID NOT NULL,
  driver_wallet    TEXT,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ NOT NULL,
  distance_km      DOUBLE PRECISION NOT NULL,
  duration_seconds INT NOT NULL,
  max_speed_kmh    REAL,
  polyline_hash    TEXT NOT NULL
);

-- Daily summaries
CREATE TABLE daily_summaries (
  vehicle_id            UUID NOT NULL,
  date                  DATE NOT NULL,
  trip_count            INT NOT NULL,
  total_km              DOUBLE PRECISION NOT NULL,
  active_seconds        INT NOT NULL,
  max_speed_kmh         REAL,
  avg_speed_kmh         REAL,
  daily_hash            TEXT NOT NULL,
  qualifies_for_revenue BOOL NOT NULL,
  anchor_tx_sig         TEXT,
  PRIMARY KEY (vehicle_id, date)
);

-- Revenue submissions (off-chain pre-anchor state)
-- see §8.5 for full schema

-- Node score history
CREATE TABLE node_score_snapshots (
  driver_wallet TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  score_x100    INT NOT NULL,
  tier          TEXT NOT NULL,
  components    JSONB NOT NULL,   -- breakdown per factor
  PRIMARY KEY (driver_wallet, snapshot_date)
);

-- Operators (KYB)
CREATE TABLE operators (
  id               UUID PRIMARY KEY,
  company_name     TEXT NOT NULL,
  wallet_pubkey    TEXT UNIQUE NOT NULL,
  kyb_docs_cid     TEXT,
  approved_at      TIMESTAMPTZ,
  approved_by      UUID,
  status           TEXT NOT NULL
);

-- Fleet pools (mirror)
CREATE TABLE fleet_pools (
  id               UUID PRIMARY KEY,
  operator_id      UUID NOT NULL REFERENCES operators(id),
  name             TEXT NOT NULL,
  region_code      TEXT NOT NULL,
  onchain_pubkey   TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL
);

-- Audit log
CREATE TABLE admin_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  target      TEXT,
  payload     JSONB,
  tx_sig      TEXT
);
```

### 11.3 Relationships Summary

- 1 Operator → N Fleet Pools → N Vehicles → N RevenueSubmissions
- 1 Vehicle → 1 Share Mint → N Investor Holders (via SPL ATAs)
- 1 Vehicle ↔ 1 Driver (current) + driver history
- 1 Vehicle → N Maintenance Records → N Workshops
- 1 Fleet Pool → N Weekly Yield Distributions → N Holder transfers

---

## 12. Refactor Plan

### 12.1 Prerequisite

PRD (this document) approved. Plan file `C:\Users\SelembarAwan\.claude\plans\melodic-wishing-marshmallow.md` approved.

### 12.2 Execution Steps

#### Step 1 — Folder rename

```
NOC ID/                    → Nemesis Protocol/
  frontend/                →   frontend noc id/
```

- Update any hardcoded absolute path references in docs and scripts.
- Preserve git history via `git mv` (or rename after commit if outside git).

**Acceptance:** Both new folder paths exist and contain expected files. Old paths no longer exist. `docs/` is intact.

#### Step 2 — Scaffold `frontend nemesis`

```
cd "Nemesis Protocol"
pnpm create next-app@latest "frontend nemesis" \
  --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint
```

- Next.js 16, Tailwind 4, TS strict.
- Copy `globals.css` from `frontend noc id` as starting theme.
- Copy shared UI primitives (Button, Input, etc.) — duplicate Phase 1; extract to `@nemesis/ui` in Phase 2.
- Initialize wallet adapter providers.

**Acceptance:** `pnpm dev` runs on 3001. Landing skeleton renders. Wallet button present.

#### Step 3 — Refactor `frontend noc id` — Delete

Delete (verify with `git status` after):
- `src/app/(app)/enterprise/` (whole subtree)
- `src/app/(app)/admin/` (whole subtree)
- `src/components/enterprise/` (whole subtree)
- `src/components/ui/FleetLeafletMap.tsx`
- `src/components/ui/GlobalCopilotSidebar.tsx`
- `src/components/ui/CopilotChatPanel.tsx`
- `src/store/useAdminStore.ts`
- `src/store/useEnterpriseStore.ts`
- `src/context/AdminContext.tsx`
- `src/context/EnterpriseContext.tsx`
- `src/types/admin.ts`
- `src/data/enterprise-models.ts`

**Acceptance:** `pnpm typecheck` reports errors only from the references we haven't cleaned yet (expected). Build intentionally broken at this point.

#### Step 4 — Refactor `frontend noc id` — Trim providers

- `src/context/Providers.tsx` — remove AdminProvider + EnterpriseProvider + CopilotProvider.
- Update `app/layout.tsx` to match.

**Acceptance:** App compiles if everything in Step 3 was fully deleted (no leftover imports).

#### Step 5 — Rename routes + rebrand UI

- `git mv src/app/(app)/dapp src/app/(app)/drive`
- `git mv src/app/(app)/workshop src/app/(app)/work`
- Global find+replace:
  - `"NOC ID"` → `"Nemesis Drive"` (in `/drive/*` contexts) or `"Nemesis Work"` (in `/work/*` contexts)
  - `href="/dapp"` → `href="/drive"` (careful: scope per file)
  - `href="/workshop"` → `href="/work"`
- Update `app/layout.tsx` metadata (title, description).
- Update `middleware.ts` to add legacy redirects: `/dapp/*` → `/drive/*`, `/workshop/*` → `/work/*`.

**Acceptance:** Every existing driver/workshop screen loads at new URL. Legacy URL redirects to new. No "NOC ID" text remains in UI.

#### Step 6 — Flip driver theme to light

- In `/drive/layout.tsx`, set theme class to `light`.
- Fork `globals.css` into per-route theme class (`.theme-light`, `.theme-dark` at layout level).
- Audit Driver components for hardcoded dark palette; replace with theme-token variables.

**Acceptance:** `/drive/*` renders light. `/work/*` stays dark. No Flash of Unstyled Content (FOUC) on first paint.

#### Step 7 — Rewrite `/` landing in `frontend noc id`

- `src/app/(marketing)/page.tsx` is **rewritten** (not deleted) to be the Drive + Work onboarding landing (§5.2 spec).
- Light theme.
- Hero split driver/workshop.

**Acceptance:** `/` displays driver & workshop onboarding, not old NOC ID marketing.

#### Step 8 — Add new driver routes

- `/drive/revenue` (form + band preview)
- `/drive/node-score`
- `/drive/gps-live`
- `/drive/maintenance`
- `/work/maintenance-proof`

**Acceptance:** Routes exist with basic scaffolding. PoA/PoR integration stubbed.

#### Step 9 — Build `frontend nemesis`

Parallel workstream after Step 2:

- Build landing (§6.1).
- Migrate `enterprise/*` → `operator/*` (rename + re-theme, adjust for SPL share token mint instead of NFT identity).
- Migrate `admin/*` → `admin/*` rebrand to "NEMESIS Admin".
- Build investor portal: `/marketplace`, `/invest/[fleetId]`, `/portfolio`, `/explorer`, `/stake`.
- Dark theme for `/operator/*` + `/admin/*`; light for landing + investor.

**Acceptance:** Landing renders at production standard. All investor portal routes exist. Operator/Admin portals have feature parity with migrated enterprise/admin.

#### Step 10 — Solana integration stubs

Both apps:
- Phantom adapter wired
- IDRX balance read on connect
- Share token balance read (investor)
- Anchor IDL-level client generated (no real txs until Phase 1)

#### Step 11 — Anchor programs (parallel track)

- `proof-of-activity`: skeleton + `commit_daily` instruction
- `proof-of-revenue`: skeleton + `submit_revenue` instruction + splits PDA logic
- `share-mint`: per-vehicle SPL mint factory
- `yield-distribution`: weekly batch distribution (merkle-claim pattern)
- All deploy to devnet

#### Step 12 — GPS ingestion service (parallel)

- Rust axum binary accepting MQTT + HTTPS
- Writes to Postgres `gps_telemetry` partitioned table
- Worker: trip segmentation → `trip_logs`
- Worker: daily aggregate → `daily_summaries` → anchor call

### 12.3 Acceptance Criteria Per Milestone

**Milestone A (Steps 1-5 done):** Existing functionality preserved at renamed routes. No regression. CI green.

**Milestone B (Steps 6-8 done):** Driver app light-themed, new routes stubbed, landing rewritten. Mobile QA on 3 devices.

**Milestone C (Step 9 done):** Nemesis app fully scaffolded. Marketing + investor + operator + admin all clickable. Copy finalized.

**Milestone D (Steps 10-12 done):** End-to-end devnet demo: driver submits revenue in `/drive/revenue` → operator reviews in `/operator/revenue` → anchor → investor sees distribution in `/portfolio`.

### 12.4 Regression Test Checklist

- [ ] Driver: start trip → GPS accumulates → end trip → day summary generates
- [ ] Driver: submit revenue in-band → AUTO_APPROVED → anchored
- [ ] Driver: submit revenue out-of-band → PENDING_REVIEW → operator approves → anchored
- [ ] Workshop: receive booking → scan VIN → submit proof of service → IDRX released
- [ ] Investor: buy shares → receive confirmation → see position in portfolio
- [ ] Investor: weekly distribution trigger → IDRX lands in wallet → portfolio updates
- [ ] Operator: review queue loads with SLA countdown → approve/reject actions anchor
- [ ] Admin: param change requires signature → audit log entry appears
- [ ] Theme: every surface matches matrix in §9.1
- [ ] A11y: keyboard-only flow for buy/submit/review passes
- [ ] i18n: all surfaces render in ID and EN without clipping

---

## 13. Roadmap

### Phase 0 — Colosseum Frontier (Q2 2026) **[Current]**

- PRD (this doc), architecture, pitch deck finalized
- Dual-app scaffolding, route rename, UI rebrand
- Anchor program skeletons
- Devnet demo of Proof of Activity → Proof of Revenue flow (stubbed GPS data)

### Phase 1 — Pilot (Q3 2026)

- 5–10 pilot EVs in Jakarta with real drivers
- Real GPS ingest, manual revenue submission
- Devnet → mainnet migration of Anchor programs
- IDRX live as settlement currency
- First weekly distribution to pilot investors (internal)
- Workshop pilot: 2 partner bengkels

### Phase 2 — Growth (Q4 2026)

- IDO $NMS (public)
- Gojek/Grab OAuth integration → auto-pull daily earnings
- 100 active vehicles across 3-5 operators
- Secondary market closed beta (whitelisted investors)
- Mobile app (React Native) for drivers (wraps `frontend noc id /drive`)

### Phase 3 — Scale (Q1-Q2 2027)

- 1,000 active vehicles
- Secondary market open (investor ↔ investor share trading)
- Data marketplace beta (anonymized mobility data, export)
- Governance live (protocol param votes moved on-chain)

### Phase 4 — Charging (Q3 2027)

- Module 2: EV charging stations tokenized
- Same 3-layer (Asset / Activity / Revenue) applied to charging throughput

### Phase 5 — Solar + EV (Q4 2027)

- Module 3: Solar + EV microgrids
- Admin backdoor removed (full decentralization)

### Phase 6 — Regional (2028+)

- Vietnam, Philippines, Thailand
- Per-country IDR-equivalent stablecoin rails
- Open protocol for third-party fleet operators

---

## 14. Open Questions & Risks

### 14.1 Regulatory

- **OJK alignment:** IDRX yield product may trigger "securities" classification. Plan: engage legal counsel in Phase 1; structure share tokens as revenue rights, not equity; explore sandbox program with Bank Indonesia for innovative FinTech.
- **KYC/AML:** Operator onboarding requires full KYB; investor KYC depth TBD (Phase 1 = threshold-based, Phase 2 = mandatory above Rp 2M aggregate exposure).
- **Tax treatment:** IDRX yield may be taxed as investment income (final 10%); confirm with tax advisor.

### 14.2 Operational

- **GPS device sourcing:** Tamper-evident, SIM-included, ≤Rp 500k BOM target. Options: OEM partnership (Teltonika, Queclink) or custom (ESP32 + GSM).
- **Cash-paying drivers:** Phase 1 is digital-payment platforms only (Gojek, Grab). Cash-heavy routes excluded until on-chain QRIS-IDRX matures.
- **Smart contract audit:** Trail of Bits or Kudelski slot booked for Phase 1 mainnet cutover. Budget ~$40-60k.
- **Smart contract upgrade path:** Phase 1 uses upgradeable programs (admin key). Phase 3+ freeze upgrade authority → on-chain governance only.

### 14.3 Product

- **Driver screenshot friction:** Can we reduce to zero-click? Phase 2 OAuth with Gojek/Grab planned; fallback remains manual.
- **Workshop discovery:** How does a driver find a nearby Nemesis-partner bengkel? Geo sort + quality score; TBD whether to integrate Google Maps SDK directly.
- **Investor onboarding:** IDRX acquisition onboarding is out-of-scope for NEMESIS; we link to IDRX partners (Flip, Tokocrypto). Is this enough UX? User test in Phase 1.
- **3D viewer retention:** Current 3D models are consumer cars (Avanza, BMW M4, Supra). Productive EV 3D assets need sourcing. Alternative: drop 3D in Phase 1, reintroduce with motorbike models in Phase 2.

### 14.4 Technical

- **Solana RPC reliability:** Depend on Helius + fallback. SLA clauses required.
- **IDRX liquidity:** DEX liquidity for 70% → driver transfers must settle within seconds. Monitor Raydium/Orca depth; consider liquidity-provider partnership.
- **Indexer lag:** If Helius indexer is >30s behind chain, operator review queue may show stale data. Custom consumer directly from validator stream as fallback.

### 14.5 Unresolved Product Questions

1. **Sub-domain routing:** `nemesis.id` + `drive.nemesis.id` + `work.nemesis.id`, or single `nemesis.id` with path-based routing? Recommendation: subdomain (clear brand separation, separate Vercel projects).
2. **Shared UI package:** Phase 1 duplicate components between apps. Phase 2 extract to `@nemesis/ui` in pnpm monorepo. Is this sequencing right? Yes — avoids premature abstraction.
3. **3D viewer scope Phase 1:** Drop for mobile driver (keep for workshop), re-source motorbike models Phase 2. Confirmed.
4. **Phantom-only Phase 1?** Add Solflare, Backpack Phase 2. Good default.

---

## 15. Appendix

### 15.1 Glossary

- **DePIN:** Decentralized Physical Infrastructure Network. Crypto-native coordination layer for real-world hardware/operations.
- **Fleet Pool:** A collection of vehicles grouped for investor purposes (risk-diversified). Investors buy fleet pool shares, not single-vehicle exposure (conceptually; mechanically, shares are per-vehicle but pools aggregate yield flow).
- **IDRX:** Indonesian Rupiah stablecoin (SPL on Solana), OJK-aligned issuance.
- **Node Score:** 0-100 scalar per driver summarizing activity quality, revenue consistency, maintenance compliance, reputation.
- **$NMS:** NEMESIS governance token. 100M supply. Utility: voting, yield boost, fee rebate.
- **PoA:** Proof of Activity. Daily GPS-derived hash anchored on-chain.
- **PoR:** Proof of Revenue. Daily revenue submission gated by PoA + GPS correlation band, split 70/20/7/3 on approval.
- **Share Token:** SPL token, 1,000 per vehicle, represents fractional revenue rights.
- **Tier:** Node score bucket — Bronze / Silver / Gold / Platinum.
- **Operator:** Fleet-owning company that registers vehicles on NEMESIS and manages drivers.
- **Super Admin:** Nemesis internal team member with protocol-level privileges.

### 15.2 Pitch Section Cross-Reference

| PRD Section | Pitch EN Section | Pitch ID Section |
|---|---|---|
| §1 Executive Summary | Executive Summary | Ringkasan Eksekutif |
| §2 Vision | Vision | Visi |
| §3 Architecture | Architecture (3 Layers) | Arsitektur (3 Layer) |
| §5-6 Module PRD | Module 1 Scope | Modul 1 Scope |
| §7 Proof of Activity | How It Works — Activity | Cara Kerja — Aktivitas |
| §8 Proof of Revenue | How It Works — Revenue | Cara Kerja — Pendapatan |
| §10 Tech Stack | Technical Stack | Stack Teknis |
| §13 Roadmap | Roadmap | Roadmap |

### 15.3 Wireframes

Figma TBD — will be linked here once design lead onboards.

### 15.4 Decision Log

| Date | Decision | By | Notes |
|---|---|---|---|
| 2026-04-19 | Dual-app split approved | User | `frontend noc id` (Drive+Work) + `frontend nemesis` (Protocol) |
| 2026-04-19 | Sub-brand: Nemesis Drive + Nemesis Work | User | NOC ID name retired from UI |
| 2026-04-19 | Workshop theme remains dark | User | Desktop long session |
| 2026-04-19 | Driver theme LIGHT | User | Mobile outdoor readability |
| 2026-04-19 | Copilot sidebar removed MVP | User | Revisit Phase 2 |
| 2026-04-19 | Module 1 scope expanded beyond motorcycles | User | Include cars, vans, trucks, buses |
| 2026-04-19 | pnpm default (ready for workspace) | Assumed | Confirm Phase 2 before monorepo |

### 15.5 References

- Pitch EN: `docs/NEMESIS_Protocol_Pitch_EN.md`
- Pitch ID: `docs/NEMESIS_Protocol_Pitch_ID.md`
- Plan file: `C:\Users\SelembarAwan\.claude\plans\melodic-wishing-marshmallow.md`
- Solana Anchor docs: https://www.anchor-lang.com
- Next.js 16 App Router: https://nextjs.org/docs/app
- IDRX: https://idrx.co

---

**End of PRD v0.1**
