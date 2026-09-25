# D.R.O.G.S

Private annual commitment portal for church leaders and pastors, with a separate administration workspace at `/admin/`.

## Current directory

- 193 leaders from the supplied master workbook
- 176 existing leader portraits preserved while the new master archive downloads
- 5,099 pastor records, including the supplied First Love roster
- Separate `B` and `P` access-code sequences for Bishops and Pastors
- UD and First Love organizations, denomination logos, and source-backed First Love groups
- $100 leader fee and $50 pastor fee

## Participant flow

1. Enter the portal password, then choose Bishops or Pastors.
2. Enter the assigned B/P code.
3. Review the matched name and portrait.
4. Complete any applicable governance questions.
5. Continue to payment without requiring every question.
6. Upload payment proof and receive a D.R.O.G.S receipt.

## Administration

Open `/admin/` and enter the current access code. The dashboard supports role, organization, denomination, and First Love group filters; payment and form status; tile/table views; full-screen profiles with previous/next navigation; payment-proof viewing; and church decisions. New records start with no application, payment, or approval; there are no fabricated dashboard statuses.

The source workbook remains the master roster. This static GitHub Pages build stores activity in the current browser. `database/schema.sql` defines the production SQL structure for shared declarations, payments, and church reviews when a hosted API is connected.

The PIN is a client-side gate, not server authentication. Screenshot blocking is not available for iPad browser pages; the privacy overlay that obscured records on Back navigation has been removed.

The new master portrait archive is still downloading. Pastor photo replacement and full reconciliation are pending. The First Love PDF provides seven group lists; `data/first-love-group-match-report.json` records assignments and names needing review. Group matching does not silently change a person's role or access code.

## Data scripts

- `scripts/build_data.py` prepares the leader portraits and directory.
- `scripts/build_pastor_data.py` prepares the pastor directory.
- `scripts/build_pastor_data.py --roster-only` updates roster data before the master photo download finishes.
- `scripts/enrich_directory.py` applies denomination logos and the supplied First Love groups while preserving portraits and access codes. Run after the roster builders.

`tests/browser_qa.mjs` checks access-code mapping, optional questionnaire submission, payment, receipt, admin access, filters, portrait directory, privacy controls, and mobile layout.
