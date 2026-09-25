# Pastoral Renewal

Annual renewal portal for bishops and pastors, with a separate renewal-office workspace at `/admin/`.

## Current directory

- 69 bishops with verified red-jacket portraits and $100 annual fees
- 4,647 pastors imported from the `pastor` tab in `MASTER-2`, with $50 annual fees
- Separate numeric access-code sequences for bishops and pastors
- Pastor records contain only renewal-directory fields: name, denomination, country, branch, appointment year and ordination year

## Renewal flow

1. Choose Bishops or Pastors.
2. Enter the personal numeric code.
3. Review the matched profile.
4. Complete the 10-question annual declaration.
5. Choose a payment method and confirm the annual fee.
6. Receive a printable personal receipt.
7. Follow the church-review status from the profile.

## Renewal office

Open `/admin/` and enter `1234`. The workspace provides role, organization, status and payment filters; table and portrait views; search; totals; and a review drawer for every record.

## Data and backend path

The master Google Sheet remains the source roster. This static GitHub Pages build stores completed renewals in the current browser. `database/schema.sql` defines the production SQL structure for shared submissions, payments and church reviews when a hosted API is connected.

## Rebuild directory data

- `scripts/build_data.py` prepares the bishop portraits and directory.
- `scripts/build_pastor_data.py` imports the pastor directory from the local master workbook while excluding phone numbers, email addresses and street addresses.

## Browser verification

`tests/browser_qa.mjs` checks role selection, code-to-person matching, the renewal form, payment receipt, admin access, filters, portrait directory and mobile layout.
