# NOC ID

NOC ID is a vehicle identity and service-history dApp. The current devnet implementation is a monorepo with:

- `frontend/`: Next.js app for owner, workshop, enterprise, and admin portals.
- `backend/`: Fastify API, Prisma/PostgreSQL, BullMQ/Redis worker, storage/payment policies.
- `programs/noc_registry/`: Rust + Anchor program for registry, credentials, service logs, case events, and payment receipts.
- `clients/ts/noc-registry/`: typed TypeScript client package.
- `infra/`: Docker Compose services and Anchor build image.
- `scripts/devnet/`: Anchor Docker build and devnet smoke helpers.

## Prerequisites

- Node.js 20+ and npm.
- Docker Desktop with Linux containers.
- PowerShell on Windows.
- Internet access for npm, Docker image pulls, Google Fonts during frontend build, and Solana devnet RPC.

Rust, Cargo, Solana CLI, and Anchor do not need to be installed on Windows for normal project work. Anchor build runs inside Docker through `npm run anchor:build`.

## Fresh Clone Setup

1. Install dependencies from the repo root:

```powershell
npm install
```

2. Create backend env:

```powershell
Copy-Item backend/.env.example backend/.env
```

Set `JWT_SECRET` to a real 32+ character value. For local dev, the default Postgres, Redis, MinIO, devnet RPC, USDC, and IDRX values are ready to use. The supported IDRX mint is:

```text
idrxZcP8xiKkYk6XGD4uz1dxEYCWSgKDHqgjsBbwDur
```

Do not use deprecated IDRX mints starting with `idrxTdN`.

Optional but recommended for embedded user wallets:

```text
EMBEDDED_WALLET_ENCRYPTION_KEY=<32+ character secret, different from JWT_SECRET>
```

3. Start local infra:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Services:

- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

4. Prepare database:

```powershell
npm run backend:prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run prisma:seed
```

5. Start backend API and worker in separate terminals:

```powershell
npm run backend:dev
npm run backend:worker
```

Backend API runs at `http://localhost:4000`.

6. Start frontend:

```powershell
npm --prefix frontend run dev
```

Frontend runs at `http://localhost:3000` and defaults to `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`.

7. Build Anchor program in Docker:

```powershell
npm run anchor:build
```

This creates/updates `idl/noc_registry.json` and `programs/noc_registry/target/deploy/noc_registry.so`.

8. Run smoke checks:

```powershell
npm run devnet:smoke
```

Expected checks: backend health, vehicles, workshops, bookings, payment config, on-chain job queue, and Solana devnet RPC health.

## Running On This Machine After Setup

If dependencies and Docker volumes already exist, the shorter loop is:

```powershell
docker compose -f infra/docker-compose.yml up -d
npm run backend:dev
npm run backend:worker
npm --prefix frontend run dev
```

Useful verification commands:

```powershell
npm run build --workspace backend
npm run build --workspace clients/ts/noc-registry
npm --prefix frontend run build
npm run anchor:build
npm run devnet:smoke
```

## Backend Flow Coverage

Implemented API surface covers the devnet plan flows:

- User auth/session/RBAC: user register/login with username, email, password, encrypted embedded devnet wallet, sessions, and `/auth/me`.
- Enterprise/workshop auth: wallet nonce/verify remains the login path for B2B portals.
- Owner app: vehicles, bookings, invoices, payments, service logs, trips, notifications.
- Workshop: registration, queue/bookings, service-log draft/build/submit, credentials.
- Enterprise: mint requests, audits, cNFT job queue, credential grant/revoke, recalls, warranties, disputes.
- Admin: config read/update surface, wallet role upsert, workshop approval, analytics, audit events.
- Solana boundary: queued on-chain job records for Anchor instructions, tx receipts, devnet config, IDRX payment intent + devnet receipt confirmation, Anchor transaction plans, DAS vehicle verification.
- Storage: public metadata hash/URI policy and private evidence hash registration.

Wallet auth verifies signed Solana messages on the backend. User auth generates a real Solana keypair server-side and stores only the encrypted secret plus public address. Vehicle mint, transfer, booking, invoice, IDRX payment, walk-in scan, and service-log anchoring now round-trip through the backend so the frontend can be tested without manually running devnet scripts.

The worker currently confirms queued jobs in devnet UI receipt mode and applies DB side effects. Real cNFT transfer/mint signing still requires a funded operator keypair plus DAS RPC; keep production signing behind explicit approval and simulation.

## Frontend Test Flow

1. Open `http://localhost:3000/register`, create a user with username, email, and password.
2. Confirm the created user has an embedded wallet address in the app account state.
3. Login enterprise via `/enterprise/login` with wallet.
4. Mint a vehicle from `/enterprise/mint`; keep backend API and worker running.
5. Phantom will ask the enterprise wallet to approve a devnet fee transaction during mint. This is a 0-lamport self-transfer used to produce a real devnet fee/signature for the UI receipt.
6. Open `/enterprise/transfer`, choose the minted vehicle, search/select the registered user email, then transfer.
7. Phantom will ask for another devnet fee transaction for ownership transfer.
8. Login as the user at `/login`; the transferred vehicle appears as the active user vehicle.
9. User books service from `/dapp/book`, or workshop scans/pastes QR payload from `/dapp/identity` in `/workshop/scan`.
10. Workshop accepts, starts service, creates invoice, and user pays with IDRX from `/dapp/book/status`.
11. Workshop clicks anchoring from `/workshop/bookings`.
12. User opens `/dapp/timeline` and sees the anchored service event with devnet receipt signature/explorer URL.

## Devnet Deployment Notes

Do not deploy or sign transactions without an explicitly approved, funded devnet authority. Before real devnet deployment, prepare:

- Funded devnet keypair or wallet-standard signing flow.
- Final `NOC_REGISTRY_PROGRAM_ID`.
- DAS-enabled RPC endpoint for cNFT fetch/update/transfer.
- Bubblegum tree address and Metaplex Core collection address.
- Irys funding/config for immutable public metadata.

## Devnet Operator Kit

The repo now includes dry-run-first operator scripts. They are ready up to the point where you provide a funded devnet wallet.

Check readiness:

```powershell
npm run devnet:preflight
npm run devnet:wallet:check
```

Create a local devnet keypair outside the repo:

```powershell
npm run devnet:wallet:create
```

Then set this in `backend/.env` or your PowerShell session:

```text
DEVNET_KEYPAIR_PATH=C:\tmp\noc-keys\noc-devnet-deployer.json
```

Airdrop devnet SOL to the printed wallet address:

```powershell
docker run --rm -v "C:\tmp\noc-keys:/keys" noc-id-anchor:0.31.1 solana airdrop 5 -u devnet -k /keys/noc-devnet-deployer.json
```

Build and deploy the Anchor program before calling any Anchor instruction:

```powershell
npm run anchor:build
npm run devnet:deploy-program
npm run devnet:preflight
```

The deploy helper uses `solana program deploy` with a persistent buffer keypair at `programs/noc_registry/target/deploy/noc_registry-buffer-keypair.json`, `--use-rpc`, and retry settings. If devnet public RPC drops write transactions, rerun the same command; it can resume with the same buffer. You can also tune retries:

```powershell
npm run devnet:deploy-program -- -MaxSignAttempts 30 -ComputeUnitPrice 5000
```

If `devnet:init-platform -- --execute` fails with `ProgramAccountNotFound`, the configured `NOC_REGISTRY_PROGRAM_ID` is not deployed on devnet yet, or it does not match `programs/noc_registry/target/deploy/noc_registry-keypair.json`. Rebuild, deploy, and rerun preflight before initializing platform state.

All real transaction scripts default to dry-run. They print the transaction summary and stop unless you add `--execute`.

Dry-run examples:

```powershell
npm run devnet:init-platform -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json
npm run devnet:create-core-collection -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --uri https://example.com/noc-id-collection.json
npm run devnet:create-bubblegum-tree -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --max-depth 14 --max-buffer-size 64
```

Execute only after reviewing the printed summary:

```powershell
npm run devnet:init-platform -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --execute
npm run devnet:create-core-collection -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --uri https://example.com/noc-id-collection.json --execute
npm run devnet:create-bubblegum-tree -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --max-depth 14 --max-buffer-size 64 --execute
```

After creating collection/tree, copy the printed env values into `backend/.env`:

```text
METAPLEX_CORE_COLLECTION_ADDRESS=<printed collectionAddress>
BUBBLEGUM_TREE_ADDRESS=<printed treeAddress>
```

Mint and register a vehicle after metadata upload and tree/collection setup:

```powershell
node --import tsx scripts/devnet/upload-metadata.ts .\path\vehicle-metadata.json vehicle
npm run devnet:register-enterprise -- --vehicle-id <db-vehicle-id>
npm run devnet:mint-vehicle-cnft -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --tree <tree-address> --collection <collection-address> --owner <owner-wallet> --uri <metadata-uri>
npm run devnet:register-vehicle-record -- --keypair C:\tmp\noc-keys\noc-devnet-deployer.json --vehicle-id <db-vehicle-id> --asset-id <cnft-asset-id> --tree <tree-address> --leaf-index <leaf-index>
npm run devnet:sync-vehicle-refs -- --vehicle-id <db-vehicle-id> --asset-id <cnft-asset-id> --tree <tree-address> --leaf-index <leaf-index> --vehicle-record-pda <vehicle-record-pda> --enterprise-record-pda <enterprise-record-pda>
```

Add `--execute` to the enterprise, mint, and register commands only after reviewing their dry-run summaries. For demo seed data whose stored owner/enterprise wallet is a placeholder, pass the deployer wallet explicitly with `--owner <wallet>` and `--enterprise-authority <wallet>`.

After deployment, update `backend/.env`:

```text
NOC_REGISTRY_PROGRAM_ID=<deployed-program-id>
SOLANA_RPC_URL=<devnet-rpc>
SOLANA_DAS_RPC_URL=<das-enabled-rpc>
```

Then run:

```powershell
npm run anchor:build
npm run devnet:smoke
```

Useful preflight helpers:

```powershell
node --import tsx scripts/devnet/upload-metadata.ts <metadata.json> vehicle
node --import tsx scripts/devnet/create-bubblegum-tree.ts
```

`create-bubblegum-tree.ts` checks RPC/DAS/tree/collection readiness. It only becomes `readyForMint` after `BUBBLEGUM_TREE_ADDRESS` and `METAPLEX_CORE_COLLECTION_ADDRESS` are configured.

Record the program id, tree address, collection address, IDRX mint, RPC/DAS URLs, and smoke output in project docs before sharing the devnet build.

## Common Issues

- Docker pull/start timeout: rerun `docker compose -f infra/docker-compose.yml up -d` after Docker Desktop is fully ready.
- Frontend build fails on fonts: allow network access so Next.js can fetch Google Fonts.
- Smoke fails only at `solana rpc health`: local services are fine, but the process cannot reach devnet RPC.
- Prisma cannot connect: confirm Postgres is up with `docker compose -f infra/docker-compose.yml ps`.
- Anchor is not installed locally: use `npm run anchor:build`; the Docker image handles Rust, Solana CLI, and Anchor.
