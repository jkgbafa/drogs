# D.R.O.G.S

Private annual commitment portal for church leaders and pastors, with a separate administration workspace at `/admin/`.

## Current directory

- 193 leaders from the supplied master workbook
- 176 confidently matched portraits from every supplied image folder
- 4,505 pastor records
- Separate numeric access-code sequences for Bishops and Pastors
- $100 leader fee and $50 pastor fee

## Participant flow

1. Choose Bishops or Pastors.
2. Enter the private numeric code.
3. Review the matched name and portrait.
4. Complete any applicable governance questions.
5. Continue to payment without requiring every question.
6. Receive a D.R.O.G.S receipt.

## Administration

Open `/admin/` and enter the current access code. The dashboard supports role switching, status filters, payment state, portrait view, searches, and church decisions.

The source workbook remains the master roster. This static GitHub Pages build stores activity in the current browser. `database/schema.sql` defines the production SQL structure for shared declarations, payments, and church reviews when a hosted API is connected.

## Data scripts

- `scripts/build_data.py` prepares the leader portraits and directory.
- `scripts/build_pastor_data.py` prepares the pastor directory.

`tests/browser_qa.mjs` checks access-code mapping, optional questionnaire submission, payment, receipt, admin access, filters, portrait directory, privacy controls, and mobile layout.
