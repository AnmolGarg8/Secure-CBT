# SecureCBT Monorepo Scaffold

Security-first computer-based testing platform repository.

## Repository Layout
- `apps/`
  - `admin-web`: React + Vite + TypeScript application for admin staff (running on port `3002`)
  - `candidate-web`: React + Vite + TypeScript application for candidates (running on port `3003`)
- `services/`
  - `auth-service`: NestJS service for authentication/authorization (running on port `3001`)
- `packages/`
  - `config`: Shared base configuration files for typescript, eslint, prettier
  - `shared-types`: Exported DTOs/interfaces shared between apps/services
  - `ui-components`: UI components shared library
- `infra/`: Local orchestration configs (Docker Compose)
- `docs/adr/`: Architecture Decision Records folder

---

## Local Setup Instructions

### Prerequisite
Install Node.js 18+ and `pnpm` 8+.

### 1. Install Dependencies
Run from the root of the project:
```bash
pnpm install
```

### 2. Start Local Databases (PostgreSQL & Redis)
To spin up postgres and redis containers:
```bash
docker-compose -f infra/docker-compose.yml up -d
```

To shut down:
```bash
docker-compose -f infra/docker-compose.yml down
```

### 3. Build Libraries
Before starting apps or services for the first time, build shared packages:
```bash
pnpm build
```

### 4. Running apps & services
You can run any package individually, or all of them in parallel.

- **Start all workspaces in watch mode (parallel):**
  ```bash
  pnpm dev
  ```
- **Start auth-service only:**
  ```bash
  pnpm --filter auth-service dev
  ```
- **Start admin-web only:**
  ```bash
  pnpm --filter admin-web dev
  ```
- **Start candidate-web only:**
  ```bash
  pnpm --filter candidate-web dev
  ```

---

## Verification & Testing

- **Lint check:**
  ```bash
  pnpm lint
  ```
- **Typecheck:**
  ```bash
  pnpm typecheck
  ```
- **Unit Tests:**
  ```bash
  pnpm test
  ```
