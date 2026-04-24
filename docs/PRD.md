# Nemesis Protocol — Product Requirements Document

**Version:** 1.0 | **Date:** April 2026 | **Target:** Colosseum Frontier Hackathon 2026

---

## 1. Context & Background

NOC ID (vehicle identity & service history platform on Solana) is being fully rebranded and repurposed into **Nemesis Protocol** — a DePIN protocol that serves as the universal financial layer for Indonesia's productive EV infrastructure ecosystem. The existing NOC ID codebase at `D:\Projekan\NOC ID\frontend` is the starting point.

**The core thesis:** Every productive EV asset in Indonesia — fleet vehicles, charging stations, solar installations — that generates verifiable cash flow can be tokenized, invested in, and distributed as on-chain yield through Nemesis Protocol.

**Three trustless proofs** form the protocol backbone:

1. **Proof of Asset** (Nemesis RWA) — physical EV asset exists, registered, tokenized as SPL shares
2. **Proof of Activity** (Nemesis DePIN) — asset is actively operating, GPS-verified on-chain
3. **Proof of Revenue** (Nemesis FI) — activity generates real revenue, auto-distributed to investors

### What's Changing vs NOC ID

| NOC ID                              | Nemesis Protocol                                           |
| ----------------------------------- | ---------------------------------------------------------- |
| Vehicle identity & service passport | EV fleet tokenization + yield infrastructure               |
| `/dapp` — personal car owner        | Deprecated for now (Phase 2+ as Nemesis Owner)             |
| `/enterprise` — OEM manufacturer    | `/rwa/operator` — fleet operator portal                    |
| `/workshop` — service center        | `/workshop` — Nemesis partner workshop (mostly repurposed) |
| `/admin` — platform admin           | `/admin` — protocol admin (mostly repurposed)              |
| Single product                      | 3-layer sub-product ecosystem                              |
| No token economy                    | Point system (pre-$NMS IDO target 2027)                    |

---

## 2. Design System — PRESERVED UNCHANGED

All styling from NOC ID is carried over exactly as-is to every portal in Nemesis Protocol. Do not modify `globals.css`.

### Color Palette

```css
/* Dark Theme Base */
--bg-base:
  #1a1d23 /* page background */ --bg-surface: #22262e /* elevated cards */
    --bg-surface-2: #2b3038 /* secondary surfaces */ --text-primary: #f4f4f5
    --text-muted: #a1a1aa --text-dim: #71717a /* Accent — Teal */
    --accent: #5eead4 /* primary teal */ --accent-strong: #14b8a6
    /* darker teal */ --accent-dim: #2dd4bf /* lighter teal */
    --accent-soft: rgba(94, 234, 212, 0.12)
    --accent-border: rgba(94, 234, 212, 0.25) /* Status */
    --status-success: #86efac --status-warning: #fcd34d --status-danger: #fca5a5
    /* Legacy Solana aliases (same values, keep for backward compat) */
    --solana-purple,
  --solana-green, --solana-cyan: all = teal variants above --solana-dark,
  --solana-dark-2,
  --solana-dark-3: bg base variants --solana-card: rgba(34, 38, 46, 0.7)
    --solana-card-border: rgba(94, 234, 212, 0.25)
    --solana-gradient: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
```

### Typography

- **Body/UI:** `Exo_2` (Google Font, variable `--font-exo2`)
- **Display/Headers:** `Orbitron` (Google Font, variable `--font-orbitron`)
- **Monospace:** `JetBrains Mono`

### Key CSS Classes (from globals.css — keep all)

- `.glass-card` — glassmorphism card with teal border + blur(20px)
- `.glass-card-static` — same without hover effect
- `.glow-btn` — primary CTA button (teal gradient)
- `.glow-btn-outline` — secondary button
- `.gradient-text`, `.gradient-text-2` — teal gradient text
- `.badge`, `.badge-purple`, `.badge-green` — status chips
- `.data-table` — styled table with teal header borders
- `.input-field` — dark input with teal focus ring
- `.orb-purple`, `.orb-green`, `.orb-cyan` — blurred gradient orbs for backgrounds
- All animation keyframes: pulse-glow, float, rotate-slow, slide-up, etc.

---

## 3. Logo & Branding

**Logo file:** `frontend/public/noc_logo.png`

- Teal/mint interlocking shape
- Used in **every portal** — DePIN, FI, RWA, Workshop, Admin, Driver
- Displayed in sidebar header and marketing navbar
- Never replaced or altered per-layer

**Brand name per layer:**

- Main: **Nemesis Protocol**
- Sub-products: **Nemesis DePIN**, **Nemesis FI**, **Nemesis RWA**
- Workshop portal: **Nemesis Workshop** (or just "Workshop Portal")
- Admin: **Nemesis Admin**

---

## 4. Architecture Decision

**Single Next.js 16 app** (existing repo) with route groups simulating multi-product architecture. No repo split until post-hackathon when team scales.

- **URL structure:** Path-based — `nemesis.id/depin`, `nemesis.id/fi`, `nemesis.id/rwa`
- **Smart contract:** `/contracts` directory (Anchor/Rust) — separate, not in frontend repo
- **Backend:** Next.js API routes for MVP + dedicated GPS ingestion service (future)
- **GPS for MVP:** Browser Geolocation API on driver's phone (no hardware GPS yet)
- **Auth:** Solana wallet connect (Phantom/Backpack) for all portals except Driver sub-portal
- **Driver auth:** Phone number + OTP only — zero Web3 exposure

### Route Group → Sub-product Mapping

```
(marketing)  →  /          Main Nemesis Protocol landing
(depin)      →  /depin     Nemesis DePIN
(fi)         →  /fi        Nemesis FI
(rwa)        →  /rwa       Nemesis RWA
(workshop)   →  /workshop  Workshop Partner Portal
(admin)      →  /admin     Protocol Admin
```

---

## 5. Complete Folder Structure

```
D:\Projekan\NOC ID\
└── frontend/
    ├── public/
    │   ├── noc_logo.png               ← LOGO — used everywhere
    │   └── ...
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx             ← KEEP (Exo2 + Orbitron fonts)
    │   │   ├── globals.css            ← KEEP UNCHANGED
    │   │   ├── template.tsx           ← KEEP
    │   │   ├── favicon.ico
    │   │   ├── middleware.ts          ← UPDATE (new redirects)
    │   │   │
    │   │   ├── (marketing)/           ← REBUILD (Nemesis Protocol landing)
    │   │   │   └── page.tsx
    │   │   │
    │   │   ├── (depin)/               ← NEW — Nemesis DePIN
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx           ← Public network dashboard
    │   │   │   ├── network/
    │   │   │   │   └── page.tsx       ← Fleet map + heatmap + activity feed
    │   │   │   ├── dashboard/         ← Auth required (wallet)
    │   │   │   │   └── page.tsx       ← Personal points, rank, portfolio link
    │   │   │   ├── quests/
    │   │   │   │   └── page.tsx       ← Social tasks → points (DeCharge Quests style)
    │   │   │   ├── earn/
    │   │   │   │   └── page.tsx       ← Campaign seasons + activity point program
    │   │   │   ├── transactions/
    │   │   │   │   └── page.tsx       ← Points history log
    │   │   │   ├── devices/
    │   │   │   │   └── page.tsx       ← GPS device registration (phone-based MVP)
    │   │   │   ├── referrals/
    │   │   │   │   └── page.tsx       ← Referral link + tracking
    │   │   │   ├── pool/
    │   │   │   │   └── [poolId]/
    │   │   │   │       └── page.tsx   ← Pool fleet map (investor-gated, from FI)
    │   │   │   └── driver/            ← Mobile-first, NO wallet, phone OTP
    │   │   │       ├── page.tsx       ← GPS toggle + flat fee status
    │   │   │       ├── schedule/
    │   │   │       │   └── page.tsx   ← Operational schedule
    │   │   │       └── docs/
    │   │   │           └── page.tsx   ← KYC document upload
    │   │   │
    │   │   ├── (fi)/                  ← NEW — Nemesis FI
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx           ← Pool listing (public)
    │   │   │   ├── pools/
    │   │   │   │   └── [poolId]/
    │   │   │   │       └── page.tsx   ← Pool detail (tabs: Overview/Report/Impact/Calculator)
    │   │   │   ├── portfolio/
    │   │   │   │   └── page.tsx       ← Investor portfolio + yield history (auth)
    │   │   │   └── stake/
    │   │   │       └── page.tsx       ← $NMS staking — PARKED (Phase 2+, show Coming Soon)
    │   │   │
    │   │   ├── (rwa)/                 ← NEW — Nemesis RWA
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx           ← Asset showcase / RWA landing (public)
    │   │   │   ├── assets/
    │   │   │   │   ├── page.tsx       ← Asset type listing
    │   │   │   │   └── [assetId]/
    │   │   │   │       └── page.tsx   ← Asset detail
    │   │   │   └── operator/          ← Fleet operator portal (auth: wallet + operator role)
    │   │   │       ├── page.tsx       ← Fleet overview dashboard
    │   │   │       ├── mint/
    │   │   │       │   └── page.tsx   ← Vehicle tokenization / minting
    │   │   │       ├── fleet/
    │   │   │       │   └── page.tsx   ← Real-time fleet map (Leaflet)
    │   │   │       ├── analytics/
    │   │   │       │   └── page.tsx   ← Fleet analytics + AI health insights
    │   │   │       ├── maintenance/
    │   │   │       │   └── page.tsx   ← Maintenance fund tracker
    │   │   │       ├── transactions/
    │   │   │       │   └── page.tsx   ← Revenue & distribution history
    │   │   │       └── settings/
    │   │   │           └── page.tsx
    │   │   │
    │   │   ├── (workshop)/            ← REPURPOSED from /workshop NOC ID
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx           ← Workshop dashboard (reputation, queue)
    │   │   │   ├── scan/
    │   │   │   │   └── page.tsx       ← Vehicle QR/manual scan
    │   │   │   ├── bookings/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── [bookingId]/
    │   │   │   │       └── page.tsx
    │   │   │   ├── queue/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── [queueId]/
    │   │   │   │       └── page.tsx
    │   │   │   ├── vehicle/
    │   │   │   │   └── [vin]/
    │   │   │   │       └── page.tsx   ← Vehicle Pre-Visit Brief (REPLACES 3D viewer)
    │   │   │   ├── history/
    │   │   │   │   └── page.tsx
    │   │   │   ├── analytics/
    │   │   │   │   └── page.tsx
    │   │   │   ├── reputation/
    │   │   │   │   └── page.tsx
    │   │   │   └── notifications/
    │   │   │       └── page.tsx
    │   │   │
    │   │   └── (admin)/               ← REPURPOSED from /admin NOC ID
    │   │       ├── layout.tsx
    │   │       ├── page.tsx
    │   │       ├── roles/
    │   │       │   └── page.tsx
    │   │       ├── operators/          ← renamed from /enterprises
    │   │       │   └── page.tsx
    │   │       ├── workshops/
    │   │       │   ├── page.tsx
    │   │       │   └── [workshopId]/
    │   │       │       └── page.tsx
    │   │       ├── fleet/              ← renamed from /vehicles
    │   │       │   ├── page.tsx
    │   │       │   └── [vin]/
    │   │       │       └── page.tsx
    │   │       ├── transactions/
    │   │       │   └── page.tsx
    │   │       ├── disputes/
    │   │       │   ├── page.tsx
    │   │       │   └── [disputeId]/
    │   │       │       └── page.tsx
    │   │       ├── analytics/
    │   │       │   └── page.tsx
    │   │       ├── config/
    │   │       │   └── page.tsx
    │   │       └── audit/
    │   │           └── page.tsx
    │   │
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AppSidebar.tsx       ← KEEP — update nav items per portal
    │   │   │   └── PortalLayout.tsx     ← KEEP — unchanged
    │   │   │
    │   │   ├── ui/                      ← KEEP ALL — unchanged
    │   │   │   ├── ConnectWalletButton.tsx
    │   │   │   ├── Toast.tsx
    │   │   │   ├── LeafletMap.tsx
    │   │   │   ├── FleetLeafletMap.tsx  ← reused in DePIN network + RWA operator
    │   │   │   ├── InteractiveDonutChart.tsx
    │   │   │   ├── WorkshopRevenueChart.tsx
    │   │   │   ├── PaymentModal.tsx
    │   │   │   ├── SharedServiceCard.tsx
    │   │   │   ├── SharedNotificationCard.tsx
    │   │   │   ├── GlobalCopilotSidebar.tsx  ← keep, AI insight panel
    │   │   │   └── CopilotChatPanel.tsx
    │   │   │
    │   │   ├── landing/                 ← REBUILD for Nemesis Protocol
    │   │   │   └── HeroCanvas.tsx       ← adapt or replace 3D hero
    │   │   │
    │   │   ├── depin/                   ← NEW
    │   │   │   ├── NetworkStatsBar.tsx       ← top bar: total fleet, km today, nodes
    │   │   │   ├── FleetCategoryCards.tsx    ← Ojol/Kurir/Logistik cards
    │   │   │   ├── DrivingDistanceStats.tsx  ← stats + line chart
    │   │   │   ├── ActivityHeatmap.tsx       ← anonymized GPS heatmap (Leaflet)
    │   │   │   ├── ActivityFeed.tsx          ← real-time anonymized activity table
    │   │   │   ├── TransactionCountChart.tsx ← on-chain submissions bar chart
    │   │   │   ├── QuestCard.tsx             ← individual quest item
    │   │   │   ├── QuestsGrid.tsx            ← quests page grid
    │   │   │   ├── PointsChart.tsx           ← points accumulation line chart
    │   │   │   ├── Leaderboard.tsx           ← global rank table
    │   │   │   ├── EarnCampaignCard.tsx      ← campaign season card
    │   │   │   ├── PoolFleetMap.tsx          ← investor pool-specific fleet map
    │   │   │   ├── VehicleRouteMap.tsx       ← Strava-style polyline per unit
    │   │   │   ├── UnitDetailModal.tsx       ← click unit → detail + route
    │   │   │   ├── DriverGPSToggle.tsx       ← mobile driver GPS on/off
    │   │   │   └── DriverFlatFeeStatus.tsx   ← daily flat fee payment status
    │   │   │
    │   │   ├── fi/                      ← NEW
    │   │   │   ├── PoolCard.tsx              ← pool listing card
    │   │   │   ├── PoolListingFilters.tsx    ← filter by APY, type, lock period
    │   │   │   ├── PoolDetailTabs.tsx        ← tab switcher (Overview/Report/Impact/Calc)
    │   │   │   ├── PoolOverviewTab.tsx       ← stats, health, recent distributions
    │   │   │   ├── PoolReportTab.tsx         ← periodic reports + yield history
    │   │   │   ├── PoolImpactTab.tsx         ← fleet env/social impact data
    │   │   │   ├── ReturnCalculator.tsx      ← input IDRX → projected return
    │   │   │   ├── YieldHistoryChart.tsx     ← weekly yield chart
    │   │   │   ├── PortfolioSummary.tsx      ← investor portfolio overview
    │   │   │   └── PoolHealthBar.tsx         ← visual active/idle/maintenance split
    │   │   │
    │   │   ├── rwa/                     ← NEW + repurposed from enterprise
    │   │   │   ├── AssetModuleCard.tsx       ← Modul 1/2/3 showcase card
    │   │   │   ├── AssetShowcaseLanding.tsx  ← RWA landing hero
    │   │   │   ├── VehiclePreVisitBrief.tsx  ← REPLACES 3D viewer for workshop
    │   │   │   ├── MaintenanceFundTracker.tsx← maintenance fund status per vehicle
    │   │   │   ├── AIFleetInsights.tsx       ← predictive maintenance panel
    │   │   │   ├── OperatorPoolBadge.tsx     ← "Nemesis Native" vs "Partner" badge
    │   │   │   └── mint/                    ← repurposed from enterprise/mint
    │   │   │       ├── VehicleForm.tsx       ← KEEP, update field labels
    │   │   │       ├── MintSummary.tsx       ← KEEP
    │   │   │       └── CsvImportModal.tsx    ← KEEP
    │   │   │
    │   │   └── workshop/                ← KEEP (minor text updates only)
    │   │       └── maintenance/
    │   │           ├── InvoiceBreakdown.tsx
    │   │           ├── PartsTable.tsx
    │   │           └── ScanPartModal.tsx
    │   │
    │   ├── store/
    │   │   ├── useAdminStore.ts         ← KEEP, update PlatformRole type
    │   │   ├── useBookingStore.ts       ← KEEP for workshop
    │   │   ├── useOperatorStore.ts      ← RENAMED from useEnterpriseStore.ts
    │   │   ├── useDepinStore.ts         ← NEW
    │   │   ├── useFiStore.ts            ← NEW
    │   │   └── useDriverStore.ts        ← NEW
    │   │
    │   ├── context/
    │   │   ├── Providers.tsx            ← UPDATE with new providers
    │   │   ├── AdminContext.tsx         ← KEEP
    │   │   ├── BookingContext.tsx       ← KEEP
    │   │   ├── OperatorContext.tsx      ← RENAMED from EnterpriseContext.tsx
    │   │   ├── DepinContext.tsx         ← NEW
    │   │   ├── FiContext.tsx            ← NEW
    │   │   └── DriverContext.tsx        ← NEW
    │   │
    │   ├── types/
    │   │   ├── admin.ts                 ← UPDATE PlatformRole enum
    │   │   ├── booking.ts               ← KEEP
    │   │   ├── depin.ts                 ← NEW (see section 10)
    │   │   ├── fi.ts                    ← NEW
    │   │   ├── rwa.ts                   ← NEW
    │   │   └── driver.ts                ← NEW
    │   │
    │   ├── lib/
    │   │   ├── booking.ts               ← KEEP
    │   │   ├── health.ts                ← KEEP (vehicle health score logic)
    │   │   ├── gps.ts                   ← NEW (trip detection, geohash, polyline)
    │   │   └── yield.ts                 ← NEW (APY calculation helpers)
    │   │
    │   ├── data/
    │   │   ├── workshops.ts             ← KEEP
    │   │   ├── operators.ts             ← RENAMED from enterprise-models.ts
    │   │   ├── pools.ts                 ← NEW (mock FI pool data)
    │   │   └── vehicles.ts             ← NEW (mock fleet vehicle data)
    │   │
    │   └── constants/
    │       ├── status.ts                ← UPDATE with Nemesis statuses
    │       └── nemesis.ts               ← NEW (protocol constants, pool types)
    │
    ├── package.json                     ← Add: recharts or chart.js if needed
    └── next.config.ts                   ← KEEP as-is
```

### Files to DELETE

```
src/app/(app)/dapp/                   ← entire dapp portal (vehicle passport)
src/app/(app)/enterprise/             ← replaced by (rwa)/operator/
src/components/3d/                    ← all 3D models (BMWM4, Supra, Harley, etc.)
src/components/landing/HeroCanvas.tsx ← rebuild for Nemesis landing
src/components/dapp/                  ← dapp-specific components
src/context/ActiveVehicleContext.tsx  ← dapp vehicle context
src/context/PartCatalogContext.tsx    ← OEM-specific, not needed
src/context/EnterpriseContext.tsx     ← renamed to OperatorContext
src/store/useEnterpriseStore.ts       ← renamed to useOperatorStore
src/data/enterprise-models.ts        ← renamed to operators.ts
```

---

## 6. Page-by-Page Specifications

---

### 6.1 Main Landing — `/`

**Route group:** `(marketing)` | **Auth:** None | **Status:** REBUILD

**Purpose:** Introduce Nemesis Protocol as a whole — the 3-layer vision, sub-products, and why Indonesia / why now. Entry point to all 3 sub-products.

**Sections:**

1. **Navbar** — Logo (`noc_logo.png`) + "Nemesis Protocol" text, links to DePIN / FI / RWA, CTA buttons ("Invest" → /fi, "Operators" → /rwa)
2. **Hero** — Headline: _"Protokol Infrastruktur EV Indonesia"_, subline with tagline from pitch, two CTAs: "Mulai Invest (IDRX)" + "Tokenisasi Armada Lo", animated background (orbs or abstract map network, no 3D model)
3. **Live Network Stats** — Animated counters: Total fleet aktif, km driven today, total yield distributed, investors
4. **3 Proof Layers** — Cards explaining DePIN / FI / RWA with icon, title, 1-sentence description, CTA per card
5. **How It Works** — 3-step flow: (1) Aset EV Didaftarkan & Ditokenisasi, (2) GPS Verifikasi Aktivitas On-chain, (3) Yield Otomatis ke Investor Setiap Senin
6. **Sub-product Showcase** — 3 cards linking to /depin, /fi, /rwa
7. **Why Solana** — Sub-cent fees, throughput for GPS hashes, IDRX native support, OJK alignment
8. **Roadmap** — Phase timeline from pitch deck
9. **Footer** — Links, Telegram, Twitter, Litepaper, ToC

---

### 6.2 Nemesis DePIN — `/depin`

---

#### 6.2.1 Public Network Dashboard — `/depin`

**Auth:** None | **Status:** NEW

**Top Stats Bar (sticky):**

```
Total Fleet: 847 unit  |  Km Hari Ini: 42.391 km  |
Active Nodes: 623  |  On-chain Submissions: 847  |  Session Timer: [live counter]
```

**Content sections (vertical scroll, like MVL DePIN):**

1. **Fleet Category Cards** — 3 cards: Ojol/Ride-hailing, Kurir/Delivery, Logistik. Each: foto unit EV, jumlah unit, km hari ini. Click → filter network map.
2. **Driving Distance Stats** — 3 metric cards (Total Period / Kemarin / 30 Hari), line chart below (reuse `WorkshopRevenueChart` adapted)
3. **Activity Heatmap** — City tab filter (Jakarta / Surabaya / Bandung / Semua). Leaflet heatmap overlay — zona aktivitas padat, toggle: Pickup Zone vs Delivery Zone. Data: **teranonimisasi**, hanya agregat.
4. **Real-Time Activity Feed** — Table: Unit (anon) | Zona Kota | Timestamp | Km | On-chain Hash (link ke Solana Explorer). "More +" button. Mirroring MVL's "Real Time Vehicle Network" table.
5. **Transaction Count Chart** — Bar chart: on-chain proof of activity submissions per hari (last 30 days)
6. **CTA Banner** — "Mau invest di fleet ini? Lihat pool di Nemesis FI →"

**Component reuse:**

- `FleetLeafletMap` → adapt jadi `ActivityHeatmap`
- `WorkshopRevenueChart` → adapt jadi `DrivingDistanceChart`
- `InteractiveDonutChart` → kategori distribusi fleet

---

#### 6.2.2 Network Detail — `/depin/network`

**Auth:** None | **Status:** NEW

Full-page view of the fleet network map, similar to MVL "Vehicle Networks" page:

- Larger map dengan dot per kendaraan (teranonimisasi)
- Sidebar: connectivity status (ON/OFF count), filter by category
- Click dot → anonymous popup: Unit Type, Zona, Km hari ini, On-chain hash (no VIN)
- Mobility heatmap toggle (pickup vs dropoff zones)

---

#### 6.2.3 Personal Dashboard — `/depin/dashboard`

**Auth:** Wallet connect required | **Status:** NEW

Stats bar: All Points (network total) | My Points | Global Rank | Progress (X/4 quest tiers) | Team/Referral count

Main content:

- **Points chart** — line chart akumulasi poin lo vs network (last 30 days)
- **Recent Activity** — list aktivitas poin terbaru
- **Leaderboard** — top 10 + posisi lo (truncated wallet address + poin)
- **Quick links** — → Quests, → Earn, → Nemesis FI Portfolio

---

#### 6.2.4 Quests — `/depin/quests`

**Auth:** Wallet connect required | **Status:** NEW

Mirip persis halaman Quests DeCharge:

- Grid quest cards, 2 kolom:
  - Follow Twitter Nemesis Protocol (+100 pts)
  - Join Telegram Nemesis (+100 pts)
  - Join Discord (+100 pts)
  - Connect Wallet (+100 pts)
  - Refer 1 operator baru (+500 pts)
  - Participate in pool Batch #1 (+1.000 pts)
  - Hold ≥1.000 poin selama 30 hari (+200 pts)
- Each card: ikon, task name, reward, tombol aksi
- Completed tasks shown with green checkmark, greyed out

---

#### 6.2.5 Earn — `/depin/earn`

**Auth:** Wallet connect required | **Status:** NEW

**Bukan investment pools** — ini halaman campaign/season untuk activity points.

Mirip halaman Earn DeCharge TAPI kontennya berbeda:

- **Season header:** "Season 1 — 10 Juta Activity Points" dengan progress bar
- **How to earn points:** list cara dapet poin aktif (operator onboard fleet, investor early pool, referral, social)
- **Active campaigns:** card per campaign dengan reward pool, progress, deadline
- **Your points breakdown:** donut chart kategori poin (social / operator / investor / referral)
- **Redemption roadmap:** "Poin ini akan bisa ditukar $NMS saat IDO 2027" — banner informatif

---

#### 6.2.6 Pool Fleet Map — `/depin/pool/[poolId]`

**Auth:** Wallet connect + must hold shares in this pool | **Status:** NEW

Investor-gated view (dikunci ke pemegang saham pool tersebut):

- Map dengan **hanya unit-unit pool ini** (misalnya 100 kendaraan Fleet Pool Batch #1)
- Tiap dot = 1 kendaraan nyata. Warna: Hijau (aktif) / Abu (idle) / Kuning (servis) / Merah (GPS offline)
- Legend: X aktif, Y idle, Z servis
- Klik unit → **UnitDetailModal:**
  - Foto kendaraan (dari registrasi)
  - Status: Online/Offline
  - Stats: Total km lifetime, km kemarin, charging sessions
  - **Rute Hari Ini (Strava-style)** — Leaflet map dengan polyline connected per trip
  - Trip log hari ini: timestamp | asal → tujuan | km | on-chain hash [Verify ↗]
  - Node Score: 94/100
  - Health Score: 87/100
  - Next maintenance: ~300 km lagi
- Pool aggregate stats: total km pool hari ini, utilisasi %, estimasi yield minggu ini

---

#### 6.2.7 Driver Sub-portal — `/depin/driver`

**Auth:** Phone OTP only. ZERO wallet, ZERO Web3. | **Status:** NEW | **Design:** Mobile-first

**Prinsip:** Driver TIDAK TAHU ini Web3. Interface sesederhana mungkin.

**Home page — `/depin/driver`:**

```
[noc_logo.png]  Nemesis Protocol

GPS Tracker
[  ● AKTIF  ]  [toggle]
Berjalan 5j 23m hari ini

Flat Fee Hari Ini
Rp 50.000  ✅ LUNAS
(atau: ⚠️ BELUM DIBAYAR — tombol bayar)

Jadwal Servis
⚠️ Servis berikutnya ~300 km lagi
Jadwal sekarang →

[Ikon notif bell]
```

**`/depin/driver/schedule`** — jadwal operasional hari ini + minggu ini

**`/depin/driver/docs`** — upload KTP, SIM, foto selfie + status KYC

**GPS Implementation (MVP):**

- Browser Geolocation API: `navigator.geolocation.watchPosition()`
- Kirim koordinat ke Nemesis backend API setiap 10 detik saat GPS aktif
- Backend handles hashing + on-chain submission
- Driver app hanya perlu toggle ON/OFF

---

### 6.3 Nemesis FI — `/fi`

---

#### 6.3.1 Pool Listing — `/fi`

**Auth:** None (public listing). Invest requires wallet connect. | **Status:** NEW

**Mirip halaman Earn DeCharge** (bukan Quests):

- **Header stats:** Total Value Locked (IDRX) | Avg APY | Total Investors | Total Yield Distributed
- **Upcoming pools** section — pool yang belum dibuka (status: "Waitlist")
- **Active pools** sections, dikelompokkan per kategori:
  - **Nemesis Native Pools** (dioperasikan Nemesis sendiri) — badge "Nemesis Native 🟢"
  - **Partner Operated Pools** — badge "Partner Operated 🔵"
- **Pool Card** per item:
  - Foto lokasi/foto armada
  - Nama pool (misal: "Fleet Pool Batch #1 — Jakarta")
  - APY range (misal: "30–41%")
  - Badge: "Energy Points Eligible" jika dapat DePIN points
  - Progress bar: Total Supplied vs Target
  - Tags: lock period (3yr/flexible), operator type
  - Tombol: "Pool Details" (existing) atau "Waitlist" (upcoming)
- **Fixed Income Pools** section — Coming Soon (render card placeholder)
- **Filter/Sort:** APY (High→Low), Lock Period, Operator Type

---

#### 6.3.2 Pool Detail — `/fi/pools/[poolId]`

**Auth:** None for viewing. Invest requires wallet. | **Status:** NEW

**Tab navigation:** Overview | Report | Impact | Calculator

**Overview tab:**

- Pool header: foto armada, nama pool, APY, TVL, status (Active/Filled/Coming Soon)
- Stats grid: Total Supplied, Target, % filled, Investors, Lock Period, Next Distribution
- **Fleet Health Visualization:** PoolHealthBar — donut/bar: X aktif / Y idle / Z maintenance
- **Unit breakdown:** berapa ojol, kurir, logistik dalam pool ini
- **Recent yield distributions:** tabel 4 minggu terakhir — tanggal, total distributed, per-share amount
- **GPS Activity preview:** mini heatmap dari aktivitas pool (anonymized)
- Invest CTA: input jumlah saham, preview return, tombol "Invest IDRX" (wallet required)
- Link: "Lihat aktivitas fleet → " (ke /depin/pool/[poolId], gated)

**Report tab:**

- Monthly/quarterly report cards: download PDF atau view inline
- Yield history chart (bar/line, per minggu, last 6 bulan)
- Utilization rate chart (% unit aktif per hari)
- Revenue vs distribution log (table)

**Impact tab:**

- Emisi CO2 yang dikurangi vs motor BBM equivalent
- Total km EV yang beroperasi via pool ini
- Total drivers supported
- Estimated economic value generated

**Calculator tab:**

- Input: jumlah IDRX yang mau diinvest
- Slider: utilisasi fleet (60%–100%)
- Mode toggle: Liquid vs Locked (3/6/12 bulan)
- Output (real-time update):
  - Estimasi yield bulanan (IDRX)
  - Estimasi yield tahunan (IDRX)
  - APY efektif
  - Break-even point (bulan ke berapa)
  - 5-year projection table

---

#### 6.3.3 Investor Portfolio — `/fi/portfolio`

**Auth:** Wallet connect required | **Status:** NEW

```
[ConnectWalletButton jika belum connect]

Portofolio Anda
Saham dimiliki:    10 / 100.000 pool
Diinvestasikan:    300.000 IDRX
Yield minggu ini:  1.920 IDRX  ✅ Diklaim otomatis
Total diperoleh:   7.680 IDRX
APY saat ini:      33,2%
```

- List semua pool yang lo ikuti + share count per pool
- Yield history chart (akumulasi per minggu)
- Transaction history: tiap distribusi Senin + on-chain hash
- Link ke pool detail + "Lihat Aktivitas Fleet →"

---

#### 6.3.4 Stake — `/fi/stake`

**Status:** PARKED — render "Coming Soon" page dengan estimasi 2027

---

### 6.4 Nemesis RWA — `/rwa`

---

#### 6.4.1 RWA Landing — `/rwa`

**Auth:** None | **Status:** NEW

**Purpose:** Introduce apa yang bisa ditokenisasi lewat Nemesis, educate operator.

- **Hero:** "Tokenisasi Infrastruktur EV Lo" — tagline, CTA "Daftar Sebagai Operator"
- **Asset Module Cards** — 3 cards:
  - **Modul 1 — Armada EV Produktif** ✅ AKTIF — ojol, kurir, logistik, semua kendaraan listrik
  - **Modul 2 — Jaringan Pengisian EV** 🔜 Berikutnya — SPKLU, charging station
  - **Modul 3 — Energi Surya + P2P** 🔮 Masa Depan — solar panel + battery storage
- **How to tokenize:** 4-step process (Daftar → Pasang GPS → Mint Token → Terima Modal)
- **Operator types:** Enterprise (Electrum, kurir perusahaan) vs Individual (pemilik motor sendiri)
- **Requirements:** GPS aktif, KYC bisnis, minimum fleet size
- CTA: "Daftar Sebagai Operator" → form pendaftaran / contact

---

#### 6.4.2 Operator Dashboard — `/rwa/operator`

**Auth:** Wallet connect + operator role | **Status:** REPURPOSED from `/enterprise`

**Sidebar nav:**

- Overview (dashboard)
- Fleet (real-time map)
- Mint (tokenisasi kendaraan baru)
- Maintenance (maintenance fund tracker)
- Analytics (fleet + AI insights)
- Transactions
- Settings

**Overview page** (from `/enterprise/page.tsx`):

- KPI cards: Total unit terdaftar, Unit aktif hari ini, Total yield distributed ke investor, Fleet health avg
- Pool summary: berapa investor di pool lo, total TVL dari pool lo
- Operator type badge: "Nemesis Native" atau "Partner"
- Recent activity feed
- Quick links ke mint, fleet map, maintenance

**Fleet Map** (from `/enterprise/fleet`):

- `FleetLeafletMap` reused
- Per-vehicle: Node Score, km hari ini, health status, maintenance status
- Klik unit → unit detail panel (VehiclePreVisitBrief ringkas)

**Mint** (from `/enterprise/mint`):

- Reuse `VehicleForm`, `MintSummary`, `CsvImportModal`
- Update labels: "Daftar Kendaraan" bukan "Genesis Mint"
- GPS device ID field added (phone IMEI atau hardware GPS ID)
- Flat fee tier selection: Rent vs Buy/Cicil

**Maintenance Fund Tracker** (NEW — from `/enterprise/warranties` logic):

- Per-vehicle maintenance fund balance (in IDRX)
- Triggered services (otomatis dari odometer)
- Pending service confirmations (workshop upload bukti → release fund)
- History: service done, km, cost, workshop

**Analytics** (from `/enterprise/analytics`):

- Avg fleet health, utilisasi rate, km per unit
- **AI Fleet Insights panel** — predictive maintenance alerts
  - "Unit #NMS-0042 diprediksi perlu brake service dalam 14 hari"
  - "3 unit di atas avg idle rate minggu ini — investigasi pengemudi"
  - "Efisiensi baterai unit #NMS-0018 turun 12% — pantau"
- Yield distribution history

---

### 6.5 Workshop Portal — `/workshop`

**Auth:** Wallet connect + workshop role | **Status:** REPURPOSED (minimal changes)

**Changes from NOC ID /workshop:**

1. **REMOVE** `/workshop/viewer` (3D viewer) — replaced by Vehicle Pre-Visit Brief
2. **REPLACE** 3D viewer with `VehiclePreVisitBrief` component di `/workshop/vehicle/[vin]`
3. **UPDATE** branding text (ganti semua "NOC" references ke "Nemesis")
4. **ADD** maintenance fund payment flow — ketika servis selesai, workshop submit bukti → release dari Maintenance Fund

**Vehicle Pre-Visit Brief** (`/workshop/vehicle/[vin]`) — replaces 3D viewer:

```
Vehicle Pre-Visit Brief
#NMS-0042 · Motor Listrik · [foto kendaraan]

Odometer: 8.247 km  |  Last service: 4.823 km (3.424 km lalu)
Trigger: 7.500 km threshold (overdue 747 km)

HEALTH SCORE: 72/100 ⚠️
  Rem      ████████░░  78%
  Ban      ██████░░░░  61% ⚠️
  Baterai  █████████░  87%
  Lampu    ██████████  95%

AI PREDICTION:
  🔴 Ban belakang: pola pengereman menunjukkan keausan tidak merata
  🟡 Sistem rem: disarankan flush brake fluid
  🟢 Baterai: degradasi normal

SERVICE HISTORY (3 terakhir):
  4.823 km · 12 Mar · Pemeriksaan dasar
  2.500 km · 18 Jan · Pemeriksaan dasar

MAINTENANCE FUND: 87.000 IDRX tersedia ✅ Cukup
Estimasi biaya: 45.000–65.000 IDRX
```

**Sidebar nav items** (update labels from NOC ID):

- Dashboard, Scan, Bookings, Queue, Kendaraan (was vehicle), History, Analytics, Reputation, Notifikasi

---

### 6.6 Admin Portal — `/admin`

**Auth:** Wallet connect + admin role | **Status:** REPURPOSED (minimal changes)

**Changes from NOC ID /admin:**

1. Rename `/admin/enterprises` → `/admin/operators` — kelola fleet operator accounts
2. Rename `/admin/vehicles` → `/admin/fleet` — global vehicle registry
3. **UPDATE** PlatformRole: `superadmin | admin | operator | workshop | driver`
   - Remove: `enterprise`, `user`
   - Add: `operator` (fleet operator), `driver` (registered driver)
4. **ADD** DePIN campaign management section (create/edit point campaigns & quests)
5. **UPDATE** all NOC text → Nemesis Protocol text
6. Config page: update fee parameters untuk model flat fee

**Keep unchanged:** roles, disputes, transactions, audit, analytics, config pages

---

## 7. Component Reuse Map

| NOC ID Component                     | Nemesis Protocol Usage                                |
| ------------------------------------ | ----------------------------------------------------- |
| `AppSidebar.tsx`                     | All portals — update nav items only                   |
| `PortalLayout.tsx`                   | All portals — unchanged                               |
| `ConnectWalletButton.tsx`            | All portals (except driver) — unchanged               |
| `FleetLeafletMap.tsx`                | DePIN network map + RWA operator fleet map            |
| `LeafletMap.tsx`                     | ActivityHeatmap base + Pool fleet map base            |
| `InteractiveDonutChart.tsx`          | DePIN fleet categories, FI pool health, RWA analytics |
| `WorkshopRevenueChart.tsx`           | DePIN driving distance chart, FI yield history chart  |
| `Toast.tsx`                          | All portals — unchanged                               |
| `PaymentModal.tsx`                   | FI invest flow, Workshop payment flow                 |
| `SharedServiceCard.tsx`              | Workshop history, RWA maintenance history             |
| `GlobalCopilotSidebar.tsx`           | All portals — AI copilot (keep)                       |
| `enterprise/mint/VehicleForm.tsx`    | RWA operator mint (update labels)                     |
| `enterprise/mint/MintSummary.tsx`    | RWA operator mint (update labels)                     |
| `enterprise/mint/CsvImportModal.tsx` | RWA operator mint (unchanged)                         |
| `workshop/maintenance/*`             | Workshop portal (unchanged)                           |
| `lib/health.ts`                      | Vehicle health score calc (keep)                      |
| `useBookingStore.ts`                 | Workshop booking state (keep)                         |
| `useAdminStore.ts`                   | Admin portal (update roles)                           |

---

## 8. Data Architecture — Transparency Layers

### GPS Data Flow

```
Driver phone GPS
    ↓ [10s interval]
Nemesis Backend API (Next.js API route or dedicated service)
    ↓
Store raw GPS: off-chain database (coordinates, timestamp, device_id)
    ↓
End of day: aggregate (total km, trip count, activity hash)
    ↓
Submit hash on-chain → Solana (Proof of Activity transaction)
    ↓
Hash publicly queryable on Solana Explorer
```

### What's Public vs Investor-Gated

| Data                              | Public | Investors (pool holders) |
| --------------------------------- | ------ | ------------------------ |
| Total fleet count                 | ✅     | ✅                       |
| Aggregate km per day              | ✅     | ✅                       |
| City-level heatmap                | ✅     | ✅                       |
| On-chain activity hashes          | ✅     | ✅                       |
| Anonymized activity feed (no VIN) | ✅     | ✅                       |
| Individual unit VIN / identity    | ❌     | ✅ (own pool only)       |
| Per-unit GPS route (Strava-style) | ❌     | ✅ (own pool only)       |
| Per-unit real-time status         | ❌     | ✅ (own pool only)       |
| Per-unit Node Score               | ❌     | ✅                       |
| Pool yield distributions          | ❌     | ✅                       |

### Pool Operator Types

```typescript
type OperatorType = "nemesis_native" | "verified_partner" | "independent";
// nemesis_native: Nemesis Protocol itself as operator (highest trust, for hackathon demo)
// verified_partner: KYC'd external fleet company (Electrum, kurir perusahaan)
// independent: individual / UKM (Phase 2+, higher deposit requirement)
```

---

## 9. TypeScript Type Definitions (New Files)

### `types/depin.ts`

```typescript
type FleetCategory = "ojol" | "kurir" | "logistik" | "korporat";
type NodeStatus = "active" | "idle" | "maintenance" | "offline";

interface NetworkStats {
  totalFleet: number;
  activeNodes: number;
  kmToday: number;
  onChainSubmissions: number;
  sessionDuration: string;
}

interface AnonymizedActivityEntry {
  unitAnonymId: string; // #NMS-*** (truncated)
  zonaKota: string;
  timestamp: string;
  kmLifetime: number;
  onChainHash: string;
  category: FleetCategory;
}

interface QuestItem {
  id: string;
  title: string;
  description: string;
  reward: number; // points
  actionUrl: string;
  completed: boolean;
  icon: string;
}

interface PointCampaign {
  id: string;
  season: number;
  title: string;
  totalPoints: number;
  distributedPoints: number;
  endDate: string;
  active: boolean;
}
```

### `types/fi.ts`

```typescript
interface StakingPool {
  id: string;
  name: string;
  operatorType: OperatorType;
  category: FleetCategory[];
  unitCount: number;
  apyMin: number;
  apyMax: number;
  totalSupplied: number; // IDRX
  targetSupply: number; // IDRX
  lockPeriodMonths: number | null; // null = flexible
  status: "upcoming" | "active" | "filled" | "closed";
  energyPointsEligible: boolean;
  imageUrl: string;
  managedBy: string; // "Nemesis Protocol" | partner name
  nextDistribution: string; // ISO date
}

interface YieldDistribution {
  poolId: string;
  date: string;
  totalDistributed: number; // IDRX
  perShare: number; // IDRX
  onChainHash: string;
  unitCount: number; // units that contributed
}

interface InvestorPosition {
  poolId: string;
  sharesHeld: number;
  invested: number; // IDRX
  yieldEarned: number; // total IDRX received
  currentApy: number;
}
```

### `types/rwa.ts`

```typescript
interface RegisteredVehicle {
  id: string;
  vin: string;
  type: VehicleType; // motor_listrik | motor_kargo | mobil | van | truk | bus
  category: FleetCategory;
  operatorId: string;
  gpsDeviceId: string;
  sharesTotal: number; // always 1000
  pricePerShare: number; // IDRX (30.000)
  odometer: number; // km
  nodeScore: number; // 0-100
  healthScore: number; // 0-100
  status: "active" | "idle" | "maintenance" | "offline";
  maintenanceFundBalance: number; // IDRX
  lastServiceKm: number;
  nextServiceKm: number;
  onChainAddress: string;
  registeredAt: string;
}

interface MaintenanceFundEntry {
  vehicleId: string;
  type: "deposit" | "release";
  amount: number; // IDRX
  triggeredAt: number; // odometer km
  workshopId?: string;
  serviceProofHash?: string;
  timestamp: string;
}
```

### `types/driver.ts`

```typescript
interface DriverProfile {
  id: string;
  phone: string;
  fullName: string;
  ktpNumber: string;
  simNumber: string;
  kycStatus: "pending" | "verified" | "rejected";
  assignedVehicleId?: string;
  contractType: "rent" | "cicil";
  flatFeeDaily: number; // IDR (not IDRX — driver doesn't know crypto)
}

interface DriverDailyStatus {
  driverId: string;
  date: string;
  gpsActive: boolean;
  flatFeePaid: boolean;
  kmToday: number;
  tripsToday: number;
  activeHours: number;
}
```

---

## 10. State Management

### New Zustand Stores

**`useDepinStore.ts`**

```typescript
State: {
  networkStats: NetworkStats
  activityFeed: AnonymizedActivityEntry[]
  myPoints: number
  globalRank: number
  questsCompleted: string[]
  activeCampaign: PointCampaign | null
}
```

**`useFiStore.ts`**

```typescript
State: {
  pools: StakingPool[]
  myPositions: InvestorPosition[]
  yieldHistory: YieldDistribution[]
}
```

**`useDriverStore.ts`**

```typescript
State: {
  profile: DriverProfile | null
  gpsActive: boolean
  todayStatus: DriverDailyStatus | null
  lastCoords: { lat: number; lng: number } | null
}
```

**`useOperatorStore.ts`** (renamed from useEnterpriseStore)

```typescript
State: {
  vehicles: RegisteredVehicle[]
  maintenanceFundLog: MaintenanceFundEntry[]
  poolSummary: { poolId: string; tvl: number; investorCount: number }[]
}
```

---

## 11. Revenue Model — Flat Fee (Updated from Pitch)

Per kesepakatan, model pendapatan bukan % split dari pendapatan driver melainkan **flat fee harian** dengan dua opsi kontrak:

| Mode          | Deskripsi                                                    | Untuk Investor                                                  |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| **Rent**      | Bayar Rp X/hari, kendaraan tetap milik protokol              | "Rent Pool" — APY lebih stabil, exit lebih mudah                |
| **Buy/Cicil** | Bayar flat fee + cicilan ownership, eventually milik sendiri | "Buy Pool" — locked, APY lebih tinggi, nilai residual kendaraan |

**Yield calculation for investors:**

```
Daily revenue per unit = flat_fee_daily × utilization_rate
Investor pool allocation = flat_fee_daily × investor_share_pct (tbd)
APY = (investor_allocation × 365) / total_invested_IDRX × 100
```

Angka APY exact akan dihitung setelah pilot phase dengan data flat fee real. PRD ini menggunakan estimasi 30–41% dari pitch deck sebagai placeholder.

---

## 12. MVP Scope vs Phase 2+ Backlog

### MVP (Hackathon Submission)

- ✅ Main landing page (Nemesis Protocol)
- ✅ Nemesis DePIN public dashboard + network page
- ✅ Nemesis DePIN quests + earn
- ✅ Driver sub-portal (phone GPS via browser)
- ✅ Nemesis FI pool listing + pool detail (with calculator)
- ✅ Nemesis FI investor portfolio
- ✅ Nemesis RWA landing + operator dashboard
- ✅ Nemesis RWA fleet mint + fleet map
- ✅ Workshop portal (repurposed)
- ✅ Admin portal (repurposed)
- ✅ Vehicle Pre-Visit Brief (replaces 3D viewer)
- ✅ Point system (pre-token, manual/mock data)
- ✅ Nemesis Native pool (Nemesis as own operator for demo)
- ✅ AI Fleet Insights panel (in RWA operator analytics)

### Parked / Phase 2+

- 🔜 $NMS token launch + real staking (2027)
- 🔜 Gojek/Grab API integration (Phase 2)
- 🔜 Hardware GPS tracker (post-MVP)
- 🔜 Modul 2 — EV Charging Network
- 🔜 Modul 3 — Solar + P2P Energy
- 🔜 Nemesis Owner portal (individual vehicle tokenization for personal car owners)
- 🔜 NFC/QR identity card (Nemesis Owner feature)
- 🔜 Book service from user side (Nemesis Owner feature)
- 🔜 Data Marketplace enterprise API
- 🔜 Secondary market for pool shares
- 🔜 Fixed Income Pools (FI page section — show Coming Soon)

---

## 13. Middleware Updates

**File:** `src/middleware.ts`

```typescript
// Remove old dapp redirects
// Add new cross-portal redirects:
/enterprise/*  →  /rwa/operator/*   (permanent redirect)
/dapp/*        →  /                 (deprecated, redirect to landing)
/depin/pool/*  →  /fi               (if not authenticated as pool investor)
```

---

## 14. Verification Checklist

After implementation, verify:

1. **Landing** — Opens at `/`, shows 3 product cards linking to /depin, /fi, /rwa
2. **DePIN public** — `/depin` loads without wallet, shows network stats + heatmap
3. **DePIN auth** — `/depin/quests` redirects to wallet connect if no wallet
4. **Driver portal** — `/depin/driver` loads on mobile, GPS toggle works, NO wallet prompt
5. **FI pools** — `/fi` shows pool cards, APY, progress bars
6. **FI calculator** — `/fi/pools/[id]` Calculator tab updates projections live
7. **FI gated** — `/depin/pool/[id]` shows "You don't hold shares in this pool" if not investor
8. **RWA landing** — `/rwa` shows 3 module cards (1 active, 2 coming soon)
9. **RWA operator** — `/rwa/operator` requires wallet + operator role, shows fleet dashboard
10. **Workshop** — `/workshop` works, vehicle/[vin] shows Pre-Visit Brief (no 3D model)
11. **Admin** — `/admin` shows updated role names (operator, driver, not enterprise/user)
12. **Logo** — `noc_logo.png` appears in sidebar of every portal
13. **Theme** — Same teal dark glassmorphism across all 6 portals
14. **No 3D models** — No Three.js components render anywhere (all deleted)
15. **No NOC branding** — No "NOC ID" text visible anywhere in the app

---

_PRD for Nemesis Protocol — built on NOC ID codebase — targeting Colosseum Frontier 2026_
_Chain: Solana | Yield Currency: IDRX | Protocol Token: $NMS (target IDO 2027)_
