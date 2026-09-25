# D.R.O.G.S

Annual commitment portal with a separate administration workspace at `/admin/`.

## Application

Next.js 16 App Router and React 19 provide the routes, page layouts and client lifecycle. The existing portal and administration interactions live in lifecycle-managed modules under `src/runtime/`. The static export is deployed to GitHub Pages by `.github/workflows/next-pages.yml`.

```sh
npm ci
npm run dev

# Build and preview with the deployed GitHub Pages path
NEXT_PUBLIC_BASE_PATH=/drogs npm run build
NEXT_PUBLIC_BASE_PATH=/drogs npm run serve
```

The preview runs at `http://localhost:4198/drogs/`. A development build without the base path runs at `/`. `scripts/prepare-public.mjs` copies only the approved `assets/` directory into `public/`; private source files and API credentials are not exported.

## Participant flow

Participants enter the portal password and their assigned B/P code, which selects their record and questionnaire automatically. Questions are optional. A resignation request skips payment and goes to confirmation. Other submissions can include payment proof using the Ghana MoMo or bank details. Confirmation thanks the participant and says their response is under review. Sessions sign out after 30 minutes of inactivity.

## Administration

Directory, Submissions and Resignations have separate views. Directory supports organization, denomination, group and status filters, tile/table views, and full-screen profiles. Submission profiles show the person's name and photo, declaration responses, submission time, payment proof and review controls. Detailed personal and ministry information remains in Directory.

Female members of the bishop category are titled Mother for UO-FLC190 and Episcopal Sister for UD-OLGC. The category remains available for filtering, separate from the person's title.

The current reconciled directory contains 243 bishop-category records and 5,070 pastor records. These are imported roster counts, not a claim that every classification has been independently verified. Photo folders never establish a person's role. The audit in `data/directory-audit.json` tracks source reconciliation. At this update, 237 bishop records and 2,996 pastor records have linked portraits; unresolved matches are retained for review instead of guessed.

## Storage and security

The deployed site remains a static application. Activity is stored in the current browser under the existing `drogs-2027` storage key, so the migration preserves existing records on the same origin. The access PIN is a client-side gate, not server authentication. The prepared API and SQL schema are not yet connected to a hosted backend, and submissions do not sync across devices. Next.js static export does not change that behavior.

Browser pages cannot prevent iPad screenshots or operating-system screen recording. Privacy controls are deterrents only; they do not hide records on Back navigation.

## Data and validation

`data/bishops.js` and `data/pastors.js` are the reconciled directories. `scripts/reconcile_missing_photos.py` fills missing portraits from named source files without adding people or changing their role. Uncertain identities and attire remain in a private review report. Do not run older roster rebuild scripts over reconciled data without reviewing their changes.

```sh
npm test
# Start the export preview first, then:
DROGS_BASE_URL=http://localhost:4198/drogs npm run test:browser
```

Browser checks cover login, forms, resignation routing, payment proof, confirmation, admin filters, submission responses and receipt previews, profile navigation, idle sign-out and mobile layout.
