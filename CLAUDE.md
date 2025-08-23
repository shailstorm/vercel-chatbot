# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Install dependencies
pnpm install

# Run development server with Turbo
pnpm dev

# Build the project (includes database migration)
pnpm build

# Start production server
pnpm start
```

### Code Quality
```bash
# Run linting and auto-fix issues
pnpm lint:fix

# Format code with Biome
pnpm format

# Run only linting (without auto-fix)
pnpm lint
```

### Database Management
```bash
# Generate database migrations
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Open Drizzle Studio for database visualization
pnpm db:studio

# Push schema changes to database
pnpm db:push
```

### Testing
```bash
# Run Playwright E2E tests
pnpm test

# Run specific test suites
pnpm exec playwright test tests/e2e/
pnpm exec playwright test tests/routes/
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and React Server Components
- **AI Integration**: Vercel AI SDK with support for xAI (Grok) and Anthropic (Claude)
- **Database**: PostgreSQL via Drizzle ORM with Neon Serverless
- **Storage**: Vercel Blob for file uploads
- **Authentication**: Auth.js (NextAuth)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Code Quality**: Biome for linting/formatting, TypeScript for type safety

### Directory Structure

#### `/app` - Next.js App Router
- `(auth)/` - Authentication pages and logic (login, register, auth config)
- `(chat)/` - Main chat application routes and API endpoints
  - `api/chat/` - Chat streaming and message handling
  - `api/document/` - Document operations
  - `api/files/` - File upload handling
  - `chat/[id]/` - Dynamic chat session pages

#### `/lib` - Core Business Logic
- `ai/` - AI provider configuration, model definitions, prompts, and tools
  - `providers.ts` - Configures AI models (Anthropic Claude, xAI Grok)
  - `tools/` - AI tool implementations (create/update documents, weather, suggestions)
- `db/` - Database schema, migrations, and queries using Drizzle ORM
- `artifacts/` - Artifact generation and rendering logic
- `editor/` - Text editor configuration and components

#### `/components` - React Components
- UI components built with shadcn/ui and Radix UI
- Chat interface components (messages, input, suggestions)
- Artifact editors (code, text, sheet, image)
- Document preview and editing components

#### `/artifacts` - Artifact Handling
- Different artifact types: code, text, sheet, image
- Each has client and server components for rendering and processing

### Key Patterns

1. **Server Components by Default**: Use React Server Components unless client interactivity is needed
2. **Streaming Responses**: Chat uses AI SDK streaming for real-time responses
3. **Database Access**: All database operations go through Drizzle ORM with type-safe queries
4. **Authentication**: Protected routes use Auth.js middleware and session management
5. **File Uploads**: Files are stored in Vercel Blob with references in PostgreSQL

### Environment Variables

Required environment variables (see `.env.example`):
- `AUTH_SECRET` - Authentication secret key
- `XAI_API_KEY` - xAI API key for Grok models
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `POSTGRES_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for caching

### AI Model Configuration

The application uses multiple AI models for different purposes:
- **Chat Model**: Anthropic Claude 3.5 Sonnet (latest)
- **Reasoning Model**: xAI Grok-3 Mini Beta with reasoning extraction
- **Title/Artifact Model**: xAI Grok-2-1212
- **Image Model**: xAI Grok-2 Image

Models are configured in `/lib/ai/providers.ts` and can be switched based on environment.

### Testing Strategy

- **E2E Tests**: Playwright tests in `/tests/e2e/` for user flows
- **Route Tests**: API route testing in `/tests/routes/`
- **Test Fixtures**: Shared test utilities in `/tests/fixtures.ts`
- Tests run against `http://localhost:3000` with automatic server startup

### Code Style

- **Formatter**: Biome with 2-space indentation, single quotes for JS/TS
- **Linter**: Biome with recommended rules plus custom configuration
- **TypeScript**: Strict mode enabled with ESNext target
- **Import Paths**: Use `@/*` alias for absolute imports from root