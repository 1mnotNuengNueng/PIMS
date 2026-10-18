# PIMS Web

```sh
npm install
npm --prefix backend run db:periods
npm run dev
```

`db:periods` adds nullable `fiscal_year` and `quarter` columns to the database configured in `backend/.env`. It can be run again safely and preserves existing data. Existing projects display an unspecified period until edited.

Fiscal years are stored as Buddhist Era years: FY 2570 runs from October 2569 to September 2570. Quarters are Q1 October–December, Q2 January–March, Q3 April–June and Q4 July–September. The selected quarter identifies the planned project period; detailed start/end dates remain available for projects spanning multiple quarters.

The proposal form saves the fiscal period. The registry and admin review desk support year/quarter filters. Admins can open full project details before reviewing, and those details also appear above the decision controls.

Checks:

```sh
npm --prefix backend run typecheck
cd backend
node --require ts-node/register --test tests/fiscal-period.test.ts
cd ../frontend
node --test tests/fiscal-period.test.mjs
node --test tests/project-review.test.mjs
npm run build
```

Optional database persistence check (creates a project inside a transaction and rolls it back): run `node tests/fiscal-period.integration.cjs` from `backend`.

## Quarterly reporting database

From `web/backend`:

```sh
npm run generate
npm run db:quarterly
npm run seed:quarterly
node tests/quarterly-reporting.integration.cjs
```

Stop the backend before generating if Windows reports a locked Prisma engine file, then restart it afterwards.

The versioned additive SQL is in `backend/prisma/manual-migrations/20261018_quarterly_reporting.sql`; it does not reset existing tables. This project has no Prisma Migrate baseline, so apply it with the script above rather than `migrate reset`.

| Table | Purpose |
| --- | --- |
| `fiscal_year` | Unique Buddhist Era year, October 1–September 30 |
| `fiscal_period` | Four quarters per year, dates and reporting deadline |
| `project_quarterly_report` | Project and period, results, KPI results, spending, progress, issues, next steps, author, submission, reviewer and review status |

Reports have separate `draft`, `submitted`, `approved`, and `resubmit` statuses. A unique constraint on `(project_id, fiscal_period_id)` prevents duplicate reports. Foreign keys preserve the project, reporting period and author referenced by a report. Deleting a reviewer clears the reviewer link. Monetary values use `DECIMAL(14,2)`; `budget_spent` is spending for that quarter, while `progress_percent` is cumulative progress (0–100). Database checks reject invalid quarters, negative spending and invalid progress.

The demo seed adds FY 2569 and 2570 (eight periods), two projects prefixed `[DEMO-QUARTERLY-v1]`, and five reports marked `is_demo = true`. FY 2569 demonstrates four quarterly reports in different review states; FY 2570 demonstrates a draft Q1 report. Deadlines of 30 days after quarter end are examples, not an institutional rule. Reruns preserve existing records and do not overwrite edited reports. Demo projects are visible in existing project lists and affect totals.

The existing `project_form.fiscal_year` and `quarter` identify the project's initial proposal period. The report relation supports later quarters and years independently. The staff progress form saves to the quarterly report table. Legacy single-value progress fields remain available for historical data. A report revision history table is not implemented.

## Admin project detail and quarterly review

From the admin review desk, choose **ดูรายละเอียด / ตรวจรายไตรมาส** to open a separate page at `#/admin/projects/<id>`. The page supports refresh, browser back and a return-to-review button. The registry's admin review action opens the same page.

The page shows the project proposal and year/quarter selector, actual quarterly report data, cumulative progress percentage, spending for the quarter, KPI results, issues and previous review feedback. Projects awaiting proposal review open at their initial period; approved projects prefer a submitted later-period report. Missing reports display no progress value; draft reports are explicitly marked. The list filters still refer to the planned project period.

Admin endpoints:

- `GET /api/projects/:id/review-details`: project, reporting periods and reports; passwords are excluded and decimal values are normalized to numbers.
- `POST /api/projects/:id/quarterly-reports/:reportId/review`: `action` is `approve` or `resubmit`; a comment is required for resubmission. Only submitted reports can be reviewed. The update targets both the project and report and rejects concurrent/repeated reviews. The project's approval status is unchanged.

Project approval remains a separate action labelled **พิจารณาสถานะโครงการ**. Run `node --test tests/quarterly-review.test.mjs` from `frontend` for navigation, selection and report rendering checks. With the backend running, run `node tests/quarterly-review.integration.cjs` from `backend` to check report review transitions, permissions and the API. All successful test writes in that check are rolled back.

## Proposal, progress and replacement lifecycle

Run `npm run db:lifecycle` from `backend` to add the `submitted` project status, `submitted_at`, `cancelled_at`, `cancellation_reason` and the optional `replacement_for_id` self-reference. Run `npm run generate` with the backend stopped to refresh Prisma, then restart the backend. The migration is repeatable and does not reinterpret existing project statuses. Legacy draft proposals must be explicitly submitted to enter the review queue.

- The initial quarter belongs to each project: a project starting in Q3 submits its proposal in Q3. This period is not a progress report and has no invented completion percentage. Earlier quarters are shown as not started.
- Saving a proposal uses `draft` (not submitted). Submitting it uses `submitted` (awaiting review). Admin review can approve or return a submitted proposal; a returned proposal can be edited and submitted again.
- Progress reports can be saved as drafts or submitted only for an approved project and only after its initial quarter. The staff reporting modal selects year/quarter and records results, KPI results, cumulative progress, quarter spending, problems and next steps. Submitted/approved reports are read-only; returned reports can be corrected and resubmitted.
- Cancellation requires a reason. It records a timestamp, preserves proposal feedback and all reports, and prevents further edits, progress submissions or reviews. `DELETE /api/projects/:id` is disabled so the workflow preserves history.
- **สร้างโครงการทดแทน** opens a new proposal linked to the cancelled project. It has a new ID and starts in a later quarter; staff may only replace projects from their own department. The admin summary links the old and new project. Reports are not copied.
- Legacy initial-quarter progress rows are retained and can be expanded under the initial proposal view. Existing reports are not automatically reclassified or deleted.

Staff endpoints are `GET /api/projects/:id/reporting` and `PUT /api/projects/:id/quarterly-reports`. The latter accepts `fiscal_year`, `quarter`, `status` (`draft` or `submitted`), `results`, `kpi_results`, `progress_percent`, `budget_spent`, `problems`, and `next_steps`. The old unscoped progress endpoint returns a validation message. Proposal transitions and report writes lock the parent project so cancellation cannot race a report submission/review.

Run `node tests/project-lifecycle.integration.cjs` from `backend` with the server running to test the Q3-proposal/Q4-progress flow, revision, cancellation preservation and a linked replacement. Successful test writes are rolled back. The year calendar generator retains existing deadlines; for newly created years it supplies example deadlines 30 days after quarter end, which should be configured for institutional policy. A per-project single-year/multi-year limit is not yet modelled.

## Word export styling

The Word export fills `backend/templates/project-proposal.docx`, converted from `Data/1. 690511(เปิดโครงการ)_โครงการกิจกรรม 5 ส. Aj.Taill-update-sj.doc`. It retains the actual source's styles, font definitions, numbering, footer, title rules, Letter page size and asymmetric margins. The 12 proposal sections use project data; original 5S expenses, names, agendas and participant lists are removed. The database currently stores a budget total/source, so exports show these and the total in Thai words; itemized expense and agenda data are not available. The approver name is blank.

The preview renders the same generated DOCX using `docx-preview`. Final pagination depends on text length and installed fonts; open in Word for print layout. Install TH SarabunPSK on machines used to view/print the documents. Production export does not require Word or LibreOffice. Include `backend/templates` when deploying the backend (also when compiling TypeScript).

Run `node tests/docx-format.test.cjs` from `backend` to test preservation of every non-document template part, paragraph slots, escaping, source-data removal and short/long/empty projects. Samples are written to the OS temporary directory for render QA. To rebuild the retained template, convert a copy of the source `.doc` to `.docx`, then run `python scripts/prepare-proposal-template.py <converted.docx>` from `backend`. Keep the original Data file unchanged. See `backend/templates/artifact.md` for the template contract.
