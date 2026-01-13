# RFC-0002: Antinote Daily OS First (Continuity Later)

* **Status:** Draft
* **Owner:** Ivan
* **Last updated:** 2026-01-13
* **Repo:** kuchmenko/antinote

## 1. Summary

Antinote will ship as a **Daily Operating System (Daily OS)**: a frictionless capture surface that turns messy inputs (voice + text) into:

1. a daily feed of entries,
2. an **Open Loops** list (tasks/questions/worries/plans you can act on), and
3. an end-of-day **Day Review** (narrative + actionable checklist).

**Continuity** (topic/project "what changed since last time?" and long-range snapshots) is intentionally deferred, but the **data model and pipelines are designed so continuity can be added later without rewriting capture**.

Core loop (v1):

> **Capture → Structure → Open Loops → Day Review**

## 2. Motivation

Most note apps excel at storage and search but fail at momentum:

* Captures don't become action.
* Open tasks get lost across days.
* Day summaries exist, but they aren't connected to a list you can actually close.

Daily OS focuses on the shortest path from "I recorded something" to "I did something," while preserving the raw record so we can build deeper continuity later.

## 3. Goals

### 3.1 Product goals (v1)

* **Instant capture**: saving is immediate; AI processing can happen after.
* **Consistent structuring**: every entry is structured into a stable schema.
* **Open Loops**: tasks/questions/worries/plans become trackable objects (complete/snooze/carryover).
* **Day Review**: produce a readable narrative and an actionable checklist.
* **Low cognitive overhead**: no new PKM system to learn.

### 3.2 Engineering goals

* **Schema-first AI**: LLM outputs are validated against strict JSON schemas.
* **Idempotent processing**: re-processing the same entry doesn't create duplicates.
* **Provenance**: derived items (loops, summaries) always reference their source entries.
* **Backfillable**: we can re-run structuring/extraction on historical entries.

## 4. Non-goals (explicitly deferred)

* Threads/projects/topics as first-class objects
* Cross-topic contradiction detection
* Multi-user collaboration
* Full research clipper pipeline (in v1, web clips can be pasted as text entries)
* Offline-first/local-only inference (not blocked, but not required for v1)

## 5. Key principles

1. **Entries are the source of truth** (raw transcript/text is immutable).
2. **Everything else is derived** (structured JSON, loops, summaries).
3. **Derived data is editable, but never hides the original**.
4. **No schema drift** (avoid "quick hacks" that create incompatible structured shapes).

## 6. Terminology

* **Entry**: a captured note (voice transcript or text).
* **StructuredData**: canonical JSON produced from an entry.
* **Loop**: a trackable open item derived from an entry (task/question/worry/plan).
* **Day Review**: compiled daily narrative + actionable checklist.
* **Carryover**: still-open loops from previous days that show up today.

## 7. Current system mapping (how this fits Antinote today)

* Existing `entries` become the canonical **Entry** object.
* Existing `structuredData` becomes canonical **StructuredData** (must be normalized).
* Existing `compilations` become **Day Reviews** (already in markdown).

The primary missing piece for Daily OS is making **Open Loops** first-class.

## 8. Canonical StructuredData (hard requirement)

All entries must store structured output using a single canonical schema.

### 8.1 JSON schema (v1)

```json
{
  "schemaVersion": 1,
  "type": "task" | "idea" | "worry" | "plan" | "unknown",
  "content": "string",
  "tags": ["string"],
  "next_steps": ["string"]
}
```

Notes:

* `schemaVersion` is required (future migrations/backfills).
* `next_steps` may be empty or omitted, but the preferred normalized form is an array (possibly empty).
* Avoid introducing a new `type: "note"` or other free-form types.

### 8.2 Normalization rule

If the system can't confidently classify, use `type: "unknown"` with best-effort tags.

## 9. Open Loops (core new concept)

Daily OS needs an object that can be completed/snoozed/carryover. That cannot reliably be done via markdown or by reading the raw entry feed.

### 9.1 New table: `loops`

A loop is something that remains open until resolved.

Logical schema:

* `id` (uuid)
* `userId` (text)
* `sourceEntryId` (uuid, FK → entries.id)
* `type` (`task | question | worry | plan`)
* `content` (text)
* `status` (`open | done | snoozed`)
* `dueAt` (timestamp, nullable)
* `snoozedUntil` (timestamp, nullable)
* `createdAt` (timestamp)
* `doneAt` (timestamp, nullable)
* `meta` (jsonb)

  * suggested fields: `extractedFrom`, `confidence`, `tags`, `origin` (e.g., `content` vs `next_steps`)

### 9.2 Uniqueness / idempotency

To prevent duplicates when re-running extraction:

* Add a stable key in `meta`, e.g. `meta.hash = sha256(sourceEntryId + type + normalizedContent)`
* Enforce uniqueness on (`userId`, `meta.hash`) if feasible.

### 9.3 Loop types in v1

* `task`: actionable work item
* `question`: something to answer
* `worry`: unresolved concern (trackable, but different UX)
* `plan`: plan item (optional in v1; can be treated as `task` later)

## 10. Loop extraction rules (conservative v1)

We want low noise. Start conservative.

Given an entry's StructuredData:

1. If `type == task`: create one `task` loop from `content`.
2. If `next_steps[]` exists: create one `task` loop per step.
3. If `type == worry`: create one `worry` loop from `content`.
4. If `type == plan`: optional (either create a `plan` loop or do nothing in v1).
5. If `type == unknown`: do not create loops.

Future: allow a user toggle "Create loops from this entry" if automatic extraction is too conservative.

## 11. UX / Screens

### 11.1 Dashboard (Daily OS)

Keep the current dashboard layout (capture + feed) and add a new top section:

**Open Loops (Today)**

* Shows:

  * open loops created today
  * carryover loops from previous days (open + not snoozed)
* Actions:

  * Mark done
  * Snooze (Today/Tomorrow/Custom)
  * Edit content
  * Jump to source entry

**Optional (v1.5): Focus**

* Pin 1–3 loops as "Focus today" (no automation required).

### 11.2 Tasks page → Loops page

Current tasks page that lists entries of type `task` should evolve into a Loops page:

* Filters by `status` (open/done/snoozed)
* Filters by `type`
* Quick bulk actions

### 11.3 Day Review page

Keep markdown Day Reviews, but augment the generation pipeline so Day Review references the day's loops.

## 12. APIs

### 12.1 Entry structuring

**POST /api/structure**

* Input: transcript/text
* Output: entry saved with canonical StructuredData
* Must:

  * validate structured JSON
  * store `schemaVersion`
  * trigger loop extraction

### 12.2 Loops

**GET /api/loops?date=YYYY-MM-DD**

* Returns open loops for that day + carryover (open loops older than that day)

**POST /api/loops/from-entry**

* Internal: derive loops for a specific entry (idempotent)

**PATCH /api/loops/:id**

* Update status (done/snoozed), edit content

Carryover can be implicit (GET returns still-open loops) to keep UX simple.

## 13. Day Review (compilation) improvements

Antinote already produces daily compilations. Daily OS requires Day Review to reflect Open Loops.

### 13.1 Evidence pack formatting

Instead of feeding raw transcripts directly, create per-entry digests:

* `[time] (type) content #tags`
* `steps: ...` (if any)

Optionally include a compact loop summary:

* `Open loops: ...`

### 13.2 Output structure (markdown)

* Narrative recap
* Decisions/insights
* Actionable checklist (preferably aligned with loops)
* Emotional state / tone (optional)

### 13.3 Provenance

Store `relatedEntryIds` (already) and optionally `relatedLoopIds` to make Day Review auditable.

## 14. Processing / Jobs

### 14.1 Pipelines

**P1: Entry ingestion**

1. Save entry (raw transcript/text)
2. Structure into canonical StructuredData
3. Save structuredData
4. Generate embedding (optional)
5. Derive loops (idempotent)

**P2: Day Review update**

1. Find entries not yet included in today's compilation
2. Build evidence pack (digests + optional open loop summary)
3. Update compilation markdown
4. Store provenance (related entries, optional loops)

### 14.2 Idempotency

* Entry structuring: deterministic per entry id
* Loop extraction: hash-based dedupe
* Compilation: incremental updates based on last compiled timestamp and relatedEntryIds

## 15. Metrics (what "Daily OS works" means)

* Capture-to-structured latency (p50/p95)
* Loops created per day (and % manually edited)
* Loops completion rate (daily/weekly)
* Carryover volume (should trend down for power users)
* Day Review open rate and time spent
* Retention: D1/D7/D30

## 16. Risks & mitigations

* **Loop noise**: too many low-quality tasks

  * start conservative; add user controls; only extract from task/next_steps/worry
* **Schema drift**: multiple structured formats in DB

  * enforce canonical schema + schemaVersion at write time
* **Timezone/day boundary**: "day" depends on user timezone

  * v1: pick a single rule (server timezone or stored user offset) and document it
  * v1.5: store user timezone and compute day boundaries correctly
* **Trust in AI**: hallucinated tasks

  * provenance (sourceEntryId), edit-first UX, conservative extraction

## 17. Rollout plan

### Phase 1 (must)

* Enforce canonical StructuredData in /api/structure
* Add `schemaVersion`

### Phase 2 (Daily OS core)

* Add `loops` table + endpoints
* Dashboard Open Loops block
* Replace tasks page with loops

### Phase 3 (Day Review alignment)

* Improve compilation evidence pack (digests)
* Include loop summary to align "Actionable checklist" with real loops

### Phase 4 (Continuity)

Introduce threads and snapshots as *derived views*:

* `threads`
* `thread_links` (entry ↔ thread, loop ↔ thread)
* `thread_snapshots` (same pattern as Day Review compilations)

Because entries store raw transcripts and StructuredData is consistent, continuity can be added by backfilling links and generating snapshots without modifying capture.

## 18. Continuity later (design constraints we must preserve)

To keep continuity easy later:

* Do not discard raw transcripts
* Keep StructuredData schema stable and versioned
* Keep loops provenance (`sourceEntryId`) and dedupe hashes
* Avoid encoding tasks only inside markdown

## 19. Open questions

1. Should `plan` loops exist in v1, or do we treat plans as entries only?
2. How should "worry" loops be handled in UX (same as tasks, or a separate list)?
3. Should carryover be automatic, or require a daily "Review & carry" action?
4. What is the minimal timezone approach we accept in v1?
5. Do we allow users to manually create loops without an entry?

## 20. Appendix: Example

### 20.1 Example entry

Input transcript:

* "Tomorrow I need to call the bank about the chargeback. Also I'm worried the deadline will slip."

StructuredData:

* type: task
* content: "Call the bank about the chargeback tomorrow."
* tags: ["finance"]
* next_steps: ["Find the transaction ID", "Prepare a short explanation"]

Loops created:

* task: Call the bank about the chargeback tomorrow
* task: Find the transaction ID
* task: Prepare a short explanation

Day Review includes:

* narrative recap
* checklist aligned with these loops
