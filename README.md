# The LLM Application Histomap

A histomap-style timeline of **LLM application** ideas and products since ChatGPT (November 2022): how entries emerge, grow, peak, and cool off, grouped into curated categories.

**In scope:** chat products, prompting and context design, RAG and vector stores, tool use and MCP, agents and workflows, orchestration frameworks, harnesses, and similar builder-facing topics.

**Out of scope:** training and alignment (RLHF, PEFT, etc.), base-model capability narratives, and LLM evaluation (benchmarks, LLM-as-judge).

The timeline is a **community consensus map**, not a strict academic chronology. Corrections and additions via PR are welcome.

## Repository layout


| Path                                  | Role                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `src/data/concepts.json`              | Concept entries grouped by category                                      |
| `src/data/products.json`              | Product entries grouped by category                                      |
| `src/data/concept-signals.mjs`        | Google Trends search terms per registry `id`                             |
| `src/data/heat-series.json`           | Generated monthly heat (see below)                                       |
| `src/data/timeline.json`              | Timeline start month (`startMonth`)                                      |
| `src/data/concepts.ts`, `products.ts` | Load and flatten registry JSON                                           |
| `src/data/observedHeat.ts`            | Scores, first-hit month, centroid for layout and tooltips                |
| `src/data/timelineBounds.ts`          | Start from `timeline.json`; end = previous calendar month                |
| `src/types.ts`                        | Types and category labels                                                |
| `src/components/`                     | Histomap chart, filters, tabs, methodology footer                        |
| `src/utils/`                          | Heat paths, label fit, category sort layout                              |
| `scripts/fetch-heat.mjs`              | Fetch Trends for all registry ids → `heat-series.json`                   |
| `scripts/fetch-heat-concept.mjs`      | Refetch one registry `id`                                                |
| `scripts/recompute-heat-scores.mjs`   | Recompute `points` from existing `termTrends` (`npm run recompute-heat`) |
| `scripts/lib/`                        | Trends client, timeline bounds, validation, heat shape                   |
| `.github/workflows/update-data.yml`   | Scheduled full refresh, commit if changed, deploy trigger                |


## Data model

### Registry (`concepts.json`, `products.json`)

Top-level array of category groups:

```json
{ "category": "prompting", "concepts": [ … ] }
```

Each entry: `id`, `name`, `summary`, optional `links[]` with `label` and `url`. Product groups use `"products"` instead of `"concepts"`.

Concept categories: `prompting`, `memory`, `tools`, `application`. Product categories: `open-source`, `closed-source`.

### Search terms (`concept-signals.mjs`)

```js
"deepseek": { terms: ["DeepSeek", "DeepSeek V3", …] }
```

Keys must match every `id` in **both** registries (and must not be orphaned). Run `npm run validate-concepts` after edits.

### Heat series (`heat-series.json`)

Written by `npm run fetch-heat`. Top-level fields:


| Field         | Meaning                                                             |
| ------------- | ------------------------------------------------------------------- |
| `generatedAt` | ISO timestamp of last write                                         |
| `partial`     | `true` while a multi-id fetch is in progress; `false` when complete |
| `formula`     | How `score` is derived                                              |
| `sources`     | `["google_trends"]`                                                 |
| `months`      | `YYYY-MM` keys from timeline start through last complete month      |
| `series`      | Map of registry `id` → entry                                        |


Each `series[id]`:


| Field        | Meaning                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `points[]`   | `{ month, score }` — monthly max across terms; drives the chart        |
| `termTrends` | `{ [term]: [{ month, trends }] }` — raw per-term series for inspection |


**Timeline:** start is fixed in `timeline.json` (`2022-11`). End rolls forward to the **previous calendar month** at build/fetch time (frontend `timelineBounds.ts`, scripts `scripts/lib/timeline-bounds.mjs`). When an entry first gets band width is when its `score` is non-zero for that month.

## Scheduled data refresh

Workflow: `.github/workflows/update-data.yml`.

1. **Trigger** — cron weekly (Monday 00:00 Beijing / Sunday 16:00 UTC) or manual `workflow_dispatch`.
2. **Full fetch** — runs `npm run fetch-heat` with `FETCH_FORCE=1`, ignoring cached entries and re-querying every registry id. Local runs without `FETCH_FORCE` skip ids already present in `heat-series.json` (useful when adding new entries only).
3. **Fetch behavior** — for each id, query each term via `google-trends-api`, roll finer Trends points up to calendar months (monthly max), set `score = max(terms)` per month, write `termTrends` alongside. Optional `HTTPS_PROXY` / `https_proxy` env for network access.
4. **Commit** — if `heat-series.json` changed, commit and push to `main`; otherwise exit with no commit.
5. **Deploy** — when data was committed, run `gh workflow run "Deploy to GitHub Pages"` (bot pushes do not re-fire other workflows’ `on: push` triggers).

Single-id refresh locally: `npm run fetch-heat-concept -- <id>`.