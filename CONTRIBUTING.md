# Contributing to CrowdFlow

Thank you for your interest in contributing to CrowdFlow! This document provides guidelines and instructions for contributing.

## Table of Contents
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)

---

## Development Setup

### Prerequisites
- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.0.0
- **Docker** & **Docker Compose** (for infrastructure services)
- **Git**

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/abulaasvh/crowdflow.git
cd crowdflow

# 2. Install dependencies (all workspaces)
npm install

# 3. Copy environment configuration
cp .env.example .env

# 4. Start infrastructure (PostgreSQL + Redis)
docker compose up postgres redis -d

# 5. Run all services in development mode
npm run dev
```

### Service Ports
| Service | Port | Description |
|---------|------|-------------|
| Auth Service | 4000 | GraphQL API, JWT auth |
| Crowd Service | 4001 | REST API |
| Crowd WebSocket | 4002 | Socket.io real-time |
| Order Service | 4003 | GraphQL API |
| Navigation Service | 4004 | REST API |
| Notification Service | 4005 | REST API |
| Staff Dashboard | 5173 | Vite dev server |

---

## Project Structure

```
crowdflow/
├── apps/
│   ├── staff-web/          # React staff dashboard (Vite)
│   └── companion-app/      # React Native mobile app (Expo)
├── services/
│   ├── auth-service/        # Authentication & authorization
│   ├── crowd-service/       # Real-time crowd intelligence
│   ├── order-service/       # Concession management
│   ├── navigation-service/  # Indoor pathfinding (Dijkstra)
│   └── notification-service/ # Push notifications (FCM)
├── packages/
│   ├── shared-types/        # Shared TypeScript types & constants
│   └── config-typescript/   # Shared tsconfig
├── deploy/
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # GCP infrastructure as code
├── docker/                  # Docker Compose configs
└── .github/workflows/       # CI/CD pipelines
```

---

## Coding Standards

### TypeScript
- **Strict mode** enabled across all packages
- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use `enum` from `@crowdflow/shared-types` for constants

### Naming Conventions
- **Files:** `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`

### Formatting
```bash
# Format all files
npm run format

# Lint all workspaces
npm run lint

# Type-check all workspaces
npm run typecheck
```

### Documentation
- All exported functions must have JSDoc comments
- Services must have a header comment explaining purpose
- Complex algorithms must include mathematical notation in comments

---

## Testing

We use **Vitest** for all unit and integration tests.

```bash
# Run all tests
npm run test

# Run tests for a specific service
cd services/auth-service && npm test

# Run with coverage
npx vitest run --coverage
```

### Test Structure
- Place tests in `__tests__/` directory next to `src/`
- Name test files `*.test.ts` or `*.test.tsx`
- Group tests with `describe()` blocks by feature area
- Use descriptive `it()` names that explain the expected behavior

### Test Coverage Targets
| Area | Target |
|------|--------|
| Algorithms | ≥ 90% |
| Business Logic | ≥ 80% |
| API Routes | ≥ 70% |
| UI Components | ≥ 60% |

---

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Implement** your changes following the coding standards above.

3. **Write tests** for any new functionality.

4. **Run the full test suite** to ensure nothing is broken:
   ```bash
   npm run test
   npm run typecheck
   ```

5. **Submit a PR** with a clear description of:
   - What changed and why
   - How to test the changes
   - Screenshots for UI changes

6. **Address review feedback** promptly.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Build, CI, tooling |
| `perf` | Performance improvement |

### Examples
```
feat(crowd-service): add Gaussian blur to heatmap generation
fix(auth-service): prevent token reuse after family revocation
docs(readme): update architecture diagram
test(navigation): add Dijkstra edge case tests
```

---

## Need Help?

- Check the [API Documentation](docs/API.md)
- Open an issue on GitHub
- Reach out to the maintainers
