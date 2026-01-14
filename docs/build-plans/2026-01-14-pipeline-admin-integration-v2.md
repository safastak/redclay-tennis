# Pipeline Admin Integration v2 - UI Implementation Plan

> **For Claude:** Execute phases sequentially. For each phase:
> 1. Check git log to understand current state (see "On Each Iteration")
> 2. Create/update the phase's detailed plan file if needed (**no commit instructions in plans**)
> 3. Use superpowers:subagent-driven-development to execute (**no commits during execution**)
> 4. Validate with `pnpm typecheck` and `pnpm build`
> 5. **After phase completion, implement test coverage** (see Testing Strategy section)
> 6. Validate tests with `pnpm build`, `pnpm test` and `pnpm sst shell -- pnpm test:integration`
> 7. **Code quality review** - check for duplication, ensure good patterns, no copy-paste code
> 8. **Review docs** - check if `docs/frontends/admin/*.md` or `docs/api/*.md` need updates
> 9. Commit the completed phase (see Commit Strategy) - **only here, after validation passes**
> 10. Proceed to next phase

**Goal:** Complete pipeline observability admin UI.

**Current State:** API work is complete and committed (see previous plan v1).

---

## On Each Iteration

1. **Check git log** - run `git log --oneline | grep "feat(admin): phase"` to see completed phases
2. **Determine current phase** - first phase (0, 1, 2, 3) not yet in commit history
3. **Check git status** - if uncommitted work exists for current phase, continue it
4. **If phase code is done but tests aren't** - implement tests first
5. **If phase + tests pass** - commit with `feat(admin): phase X - [description]`
6. **When all 4 phases are committed** - proceed to Final Verification

## Final Verification

After all phases are committed, verify success criteria before completing:

1. **Run full validation:**
   ```bash
   pnpm typecheck && pnpm build && pnpm lint && pnpm test
   pnpm sst shell -- pnpm test:integration
   ```

2. **Code quality audit:**
   - No code/schema duplication across files
   - Shared logic extracted to reusable utils/hooks
   - Consistent patterns across all pipeline pages
   - No copy-paste code that should be abstracted

3. **Check Success Criteria** - review each item in the Success Criteria section below

4. **If any criteria not met:**
   - Identify what's missing
   - Create a fix (no new phase needed, just patch)
   - Commit as `fix(admin): [description]`
   - Re-run verification

5. **When ALL success criteria are met** - output: `<promise>PIPELINE ADMIN UI COMPLETE</promise>`

---

## Commit Strategy

- **Do NOT commit during plan creation or execution**
- **Do NOT include commit instructions in phase sub-plans**
- **Commit checkpoint:** After each phase AND its test coverage are complete and passing:
  1. Run `pnpm typecheck && pnpm build && pnpm test`
  2. For Phase 0 also run: `pnpm sst shell -- pnpm test:integration`
  3. If all pass, create a single commit for the phase
  4. Commit message format: `feat(admin): phase X - [brief description]`
- **Never commit partial work** - each commit should be a complete, working phase

---

## Summary: Admin Docs Alignment

| Document | Alignment Status |
|----------|------------------|
| `admin/design.md` | **Aligned** - Describes TanStack Query pattern, database architecture matches implementation |
| `admin/roadmap.md` | **Aligned** - Phase 14 (Pipeline Observability) maps to our Phases 1-3 |
| `admin/pipeline-observability.md` | **Aligned** - Detailed UI mockups ready for implementation |

The admin documentation accurately reflects the API endpoints implemented in v1.

---

## API Gaps to Address First

Before starting UI work, these API issues must be fixed:

### Gap 1: Artifacts Route Not Mounted
- `artifacts.ts` exists but is not imported in `pipeline/index.ts`
- **Fix:** Add `pipeline.route('/items', artifactsRoutes)` nested under items

### Gap 2: Items API Extensions for Work Queue UI
- Work Queue page needs additional Items endpoints
- **Impact:** Phase 2 (Monitoring UI) depends on these endpoints
- **Endpoints to add to `/admin/pipeline/items`:**
  ```
  GET    /admin/pipeline/items/summary    # Counts by stage (fetch/enrich/distill) and status
  GET    /admin/pipeline/items/stuck      # Items pending > configurable threshold
  POST   /admin/pipeline/items/bulk/reprocess   # Bulk retry
  POST   /admin/pipeline/items/bulk/skip        # Bulk skip/dismiss
  ```

### Gap 3: Pipeline Status Endpoint is Stub
- Current `/status` returns hardcoded data
- Need to aggregate from: Items (by status), Hosts (circuit state), DataSources (next run)

---

## Phase Overview

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 0 | API Gaps (artifacts, items extensions, status) | None |
| 1 | DataSources & Items UI | Phase 0 |
| 2 | Monitoring UI (runs, work queue, hosts) | Phase 1 |
| 3 | Match Review & Provenance UI | Phase 2 |

---

## Phase 0: API Gap Fixes

**Scope:** Fix missing API functionality before UI work.

### 0.1 Mount Artifacts Routes
- Add artifacts import to `pipeline/index.ts`
- Routes become: `/admin/pipeline/items/:itemId/raw`, `/admin/pipeline/items/:itemId/enriched`

### 0.2 Extend Items API for Work Queue UI
- Add endpoints to existing `packages/functions/src/api/routes/admin/pipeline/items.ts`
- Extend `packages/shared/src/admin-api-schema/items.ts` with new schemas
- Key endpoints to add:
  - `GET /items/summary` - Counts by stage (fetch/enrich/distill) and status (pending/processing/completed/failed)
  - `GET /items/stuck` - Items pending longer than threshold (default 1 hour)
  - `POST /items/bulk/reprocess` - Bulk retry by filter criteria
  - `POST /items/bulk/skip` - Bulk skip/dismiss items

### 0.3 Fix Pipeline Status Endpoint
- Query Items for status counts
- Query Hosts for circuit breaker states
- Query DataSources for next scheduled runs
- Return aggregated dashboard data

**Validation:**
- `pnpm typecheck`
- `pnpm test`
- `pnpm sst shell -- pnpm test:integration`

---

## Phase 1: DataSources & Items UI

**Scope:** Admin pages for browsing and managing pipeline data.

### 4.1 Pipeline API Client & Hooks
Create pipeline-specific API client and TanStack Query hooks:

**Files:**
- `apps/admin/lib/pipeline-api.ts` - API methods for pipeline endpoints
- `apps/admin/lib/pipeline-hooks.ts` - Query/mutation hooks

**API Methods:**
```typescript
// DataSources
getDataSources(params)
getDataSource(id)
updateDataSource(id, data)
toggleDataSource(id, enabled)
triggerDataSource(id)

// Items
getItems(params)
getItem(itemId)
getItemEpochs(itemId)
getItemCounts()
reprocessItem(itemId)
unlinkItem(itemId)
getItemRawUrl(itemId, epoch?)
getItemEnrichedUrl(itemId, epoch?)

// Runs
getRuns(params)
getRun(epoch)

// Hosts
getHosts(params)
updateHost(hostname, data)
resetHostCircuit(hostname)

// Reviews
getReviews(params)
resolveReview(reviewId, action)

// Provenance
searchProvenance(type, value)
getEntityProvenance(entityId)
getAssetProvenance(assetId)
```

### 4.2 DataSources List Page
**Route:** `/admin/pipeline/datasources`

**Features:**
- List datasources with stats (item count, next run, enabled status)
- Enable/disable toggle
- Trigger immediate crawl action
- Link to filtered Items view
- Link to filtered Runs view

### 4.3 Items Browser Page
**Route:** `/admin/pipeline/items`

**Features:**
- List items with pagination (cursor-based)
- Filters: dataSourceId, status, isLinked
- Quick filter pills: Unlinked, Failed, Processing
- Expandable row with error details
- Quick actions: Retry, View Details

### 4.4 Item Detail Page
**Route:** `/admin/pipeline/items/[itemId]`

**Features:**
- Item metadata (scope, reference, status, linked entity)
- Epoch timeline (horizontal scroll)
- Clickable stage cells with inline details
- Identifiers table with cross-reference links
- Actions: Re-fetch, Unlink, View S3 artifacts

### 4.5 Shared Components
**Location:** `apps/admin/components/pipeline/`

```
components/pipeline/
├── EpochTimeline.tsx        # Reusable epoch history view
├── StageCell.tsx            # Clickable stage status cell
├── StatusBadge.tsx          # Item/stage status badges
├── QuickFilters.tsx         # Pill-style filter buttons
├── ItemExpandedRow.tsx      # Inline expanded item details
└── ArtifactViewer.tsx       # S3 content preview modal
```

**Validation:**
- `pnpm typecheck`
- `pnpm dev --filter=admin` - Manual verification

---

## Phase 2: Monitoring UI

**Scope:** Real-time monitoring and work queue management.

**Prerequisite:** Items API extensions from Phase 0.2

### 5.1 Enhanced Pipeline Overview
**Route:** `/admin/pipeline` (replace existing)

**Features:**
- Summary cards: queue depth per stage
- DataSource status table with inline actions
- Recent runs with expandable details
- Alerts section for stuck items / open circuits

### 5.2 DataSource Runs Page
**Route:** `/admin/pipeline/runs`

**Features:**
- List runs by dataSourceId + epoch
- Expandable row with stage breakdown
- Outcomes summary (created, updated, matched, sent to review)
- Actions: View Items, Retry Failed

### 5.3 Work Queue Page
**Route:** `/admin/pipeline/work`

**Features:**
- Real-time item list with auto-refresh toggle
- Summary cards (per-stage counts)
- Filters: stage, status, dataSourceId, age
- Multi-select with bulk actions
- Stuck items alert section
- Actions: Retry, Skip

### 5.4 Host Management Page
**Route:** `/admin/pipeline/hosts`

**Features:**
- List hosts with rate limit state
- Circuit breaker status (closed/half-open/open)
- Token bucket visualization (optional)
- Reset circuit action
- Adjust rate limits (stretch goal)

**Validation:**
- `pnpm typecheck`
- `pnpm dev --filter=admin` - Manual verification

---

## Phase 3: Match Review & Provenance UI

**Scope:** Human-in-the-loop review and cross-source navigation.

### 6.1 Match Review Queue Page
**Route:** `/admin/pipeline/reviews`

**Features:**
- List pending reviews with type filter (entity/asset)
- Expandable comparison view (incoming vs suggested match)
- Match reasoning display
- Actions: Merge, Create New, Assign Different, Skip
- S3 artifact links

### 6.2 Provenance Explorer Page
**Route:** `/admin/pipeline/provenance`

**Features:**
- Identifier search (type + value)
- Results grouped by linked entity/asset
- Duplicate detection alert (same identifier, multiple entities)
- Contributing items list per entity
- Merge entities action

### 6.3 Entity/Asset Pipeline Sources Tab
**Location:** Extend existing entity/asset edit pages

**Features:**
- New "Pipeline Sources" tab on Entity edit
- New "Pipeline Sources" tab on Asset edit
- Contributing items list with inline expand
- Per-item epoch timeline
- Identifiers contributed per item
- Match confidence display
- Quick actions: View S3, Unlink, Re-process

**Validation:**
- `pnpm typecheck`
- `pnpm dev --filter=admin` - Manual verification

---

## Component Architecture

```
apps/admin/
├── app/pipeline/
│   ├── page.tsx                    # Enhanced overview (Phase 2.1)
│   ├── datasources/
│   │   └── page.tsx                # DataSources list (Phase 1.2)
│   ├── items/
│   │   ├── page.tsx                # Items browser (Phase 1.3)
│   │   └── [itemId]/page.tsx       # Item detail (Phase 1.4)
│   ├── runs/
│   │   └── page.tsx                # Runs list (Phase 2.2)
│   ├── work/
│   │   └── page.tsx                # Work queue (Phase 2.3)
│   ├── hosts/
│   │   └── page.tsx                # Host management (Phase 2.4)
│   ├── reviews/
│   │   └── page.tsx                # Match review (Phase 3.1)
│   └── provenance/
│       └── page.tsx                # Provenance explorer (Phase 3.2)
├── components/pipeline/
│   ├── EpochTimeline.tsx
│   ├── StageCell.tsx
│   ├── StatusBadge.tsx
│   ├── QuickFilters.tsx
│   ├── ItemExpandedRow.tsx
│   ├── ArtifactViewer.tsx
│   ├── MatchComparison.tsx
│   ├── MatchReasoning.tsx
│   ├── ProvenanceResults.tsx
│   └── DuplicateAlert.tsx
├── components/entities/pipeline/
│   ├── PipelineSourcesTab.tsx      # For entity edit (Phase 3.3)
│   └── ContributingItemsList.tsx
└── lib/
    ├── pipeline-api.ts             # Pipeline API client
    └── pipeline-hooks.ts           # TanStack Query hooks
```

---

## Learnings from v1 (Applied)

These patterns from API implementation should guide UI work:

1. **Use shared Zod schemas** - Import types from `@searchapp/shared/admin-api-schema` for API responses
2. **Required filters** - Some endpoints require filters; UI should enforce this
3. **Cursor pagination** - Use cursor-based pagination, not offset
4. **Sort order abstraction** - `default`/`reverse` in UI, mapped to repo-specific ordering
5. **TanStack Query pattern** - Already established in `hooks.ts`, extend for pipeline

---

## Testing Strategy

> **Reference:** See full testing documentation at `docs/engineering/testing.md`

### Testing Philosophy

1. **Test at the right level** - Unit tests for logic/schemas, integration tests for API routes
2. **Real resources for integration** - Use `sst dev` stage, not mocks for AWS/DB
3. **Test what matters** - Business logic and integration points, not framework boilerplate

### Test Types & File Patterns

| Type | Pattern | Location | Run Command |
|------|---------|----------|-------------|
| Unit (schemas) | `*.test.ts` | `packages/shared/src/admin-api-schema/__tests__/` | `pnpm test` |
| Unit (utils) | `*.test.ts` | Next to source files | `pnpm test` |
| Integration (API) | `*.integration.test.ts` | `packages/functions/src/api/routes/admin/pipeline/__tests__/` | `pnpm sst shell -- pnpm test:integration` |

### Running Tests

```bash
# Unit tests (fast, no AWS credentials needed)
pnpm test

# Unit tests in watch mode
pnpm test:watch

# Integration tests (requires SST dev stage)
pnpm sst shell -- pnpm test:integration

# Run specific test file
pnpm test -- packages/shared/src/admin-api-schema/__tests__/items.test.ts

# Run with coverage
pnpm test:coverage

# Run integration tests 
pnpm sst shell -- pnpm test:integration
# or to execute specific test file: cd packages/functions && pnpm sst shell -- pnpm test:integration ./src/api/routes/__tests__/chat.integration.test.ts
```

### Test Coverage by Phase

#### Phase 0: API Gap Fixes
- **Items API extension schema tests** → extend `packages/shared/src/admin-api-schema/__tests__/items.test.ts`
  - Schema validation for new endpoints (summary, stuck, bulk operations)
  - Query param parsing (threshold, filters)
- **Items API extension integration tests** → extend `packages/functions/src/api/routes/admin/pipeline/__tests__/items.integration.test.ts`
  - Summary endpoint returns correct counts by stage/status
  - Stuck endpoint respects threshold parameter
  - Bulk reprocess/skip operations
  - Authorization checks (admin only)

#### Phase 1: DataSources & Items UI
- **API client tests** → `apps/admin/lib/__tests__/pipeline-api.test.ts`
  - Method signatures match expected API shape
  - Query param encoding
  - Error response handling
- **Hook tests** → `apps/admin/lib/__tests__/pipeline-hooks.test.ts`
  - Query key structure
  - Cache invalidation on mutations
  - Loading/error states

#### Phase 2: Monitoring UI
- Extend Phase 1 tests with:
  - Work queue hooks
  - Auto-refresh behavior (refetchInterval)
  - Summary endpoint validation

#### Phase 3: Match Review & Provenance UI
- **Review action tests** → Schema validation for resolution actions
- **Provenance search tests** → Query param validation, result grouping logic

### Existing Test Patterns (Reference)

**Schema unit tests** (from `items.test.ts`):
```typescript
describe('itemListQuerySchema', () => {
  it('should reject when no filter provided', () => {
    const result = itemListQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should parse valid status filter', () => {
    const result = itemListQuerySchema.safeParse({ status: 'failed' });
    expect(result.success).toBe(true);
  });
});
```

**Integration tests** (from `items.integration.test.ts`):
```typescript
describe('Items API Integration', () => {
  const testPrefix = `item-api-integration-${Date.now()}`;
  let adminToken: string;

  beforeAll(async () => {
    const admin = await getOrCreateTestUser(testUsers.admin);
    adminToken = await generateTestToken(admin.id, admin.email!, 'admin');
    // Create test items...
  });

  afterAll(async () => {
    await cleanupDynamoDb();
    await cleanupDb();
  });

  it('should list items filtered by dataSourceId', async () => {
    const res = await app.request(
      `/admin/pipeline/items?dataSourceId=${testDataSourceId}`,
      { headers: authHeader(adminToken) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
  });
});
```

### Test Utilities

Located in `packages/functions/src/test/`:
- `setup.integration.ts` - Test user creation, DynamoDB item tracking, cleanup
- `utils.ts` - Token generation, auth header helpers
- `mocks/jose.ts` - JWT mock for tests without real JWKS

### Coverage Targets

| Area | Target |
|------|--------|
| Schema validation (`admin-api-schema`) | 90% |
| API routes (integration) | 80% |
| Pipeline hooks (unit) | 70% |

---

## Success Criteria

### Functionality
- [ ] All pipeline pages accessible from sidebar navigation
- [ ] DataSources manageable (view, toggle, trigger)
- [ ] Items browsable with filters and pagination
- [ ] Item detail shows epoch history and identifiers
- [ ] Work queue monitorable with bulk retry/skip
- [ ] Runs viewable with stage breakdown
- [ ] Hosts manageable with circuit reset
- [ ] Match reviews processable with comparison view
- [ ] Provenance searchable with duplicate detection
- [ ] Entity/Asset shows contributing pipeline items
- [ ] All pages use TanStack Query with proper caching

### Code Quality
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] No code/schema duplication across files
- [ ] Shared logic extracted to reusable utils/hooks
- [ ] Consistent patterns across all pipeline pages (filters, pagination, error handling)
- [ ] No copy-paste code that should be abstracted

### Test Coverage
- [ ] Items API extension tests complete and passing (summary, stuck, bulk operations)
- [ ] Items integration tests updated and passing
- [ ] Pipeline API client unit tests implemented
- [ ] Pipeline hooks unit tests implemented
- [ ] All unit tests pass (`pnpm test`)
- [ ] All integration tests pass (`pnpm sst shell -- pnpm test:integration`)
- [ ] Schema validation coverage ≥ 90%
- [ ] API route coverage ≥ 80%
- [ ] Hook coverage ≥ 70%

### Documentation
- [ ] `docs/frontends/admin/pipeline-observability.md` reflects actual implementation
- [ ] `docs/frontends/admin/design.md` updated if patterns changed
- [ ] `docs/api/design.md` updated if API endpoints changed
- [ ] No TODOs or placeholders left in docs for implemented features
