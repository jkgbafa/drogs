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

Participants enter the portal password and their assigned B/P code. They can save a draft, review all answers, return to edit, and confirm a truthfulness declaration before submitting. All visible choice questions, counts and main written answers are required; explanatory notes are optional. Resignations skip payment.

Complete applications with clear responses are automatically approved and proceed to payment. Explicit concerns, doctrine or vision reservations, health impact, personal conduct disclosures, faith/prayer struggles, requests for discussion and any confidential notes require individual review. Three or more middle answers on routine participation/commitment questions also require review. A health disclosure routes to support review; it does not automatically decline an application. Missing or unknown answers never qualify for automatic approval. The rules, flagged question/answer snapshots, decision method and timestamps are recorded with the submission. Older submissions are not retrospectively auto-approved under new rules.

## Administration

Directory contains profiles. Submissions defaults to applications needing individual review, showing the person's photo, name, denomination and flagged answers, without the full personal-information grid. Automatically approved applications are excluded. Reviewed flagged cases remain available through the Reviewed applications filter. Legacy forms without a flag snapshot have an expandable original-response view so an administrator can assess them.

Administrators use direct buttons to approve and unlock payment, request discussion, hold, decline or save a note. Decisions retain an audit history and can include a message displayed in the applicant's portal. No email or WhatsApp notification is sent. The dashboard places resignation and review counts side by side. Approval updates synchronize between tabs in the same browser; cross-device delivery requires the backend described below.

Female members of the bishop category are titled Mother for First Love and Outreach, and Episcopal Sister for UD. The bishop category contains 258 records (UD 178, First Love 68, Outreach 12); there are 5,070 pastors (UD 4,379, First Love 685, Outreach 6), for 5,328 people overall. The FLOW Office has only three bishop-category members: Nely Nina Masuku, Leonard Hyde and Brian Masuku. Its six other members are Outreach pastors; prior codes and submissions are preserved through aliases. These are reconciled roster counts, not independent confirmation of every classification.

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

Current browser checks cover saving, previewing and editing answers, truthfulness confirmation, automatic approval for both roles, flagged health responses, payment locking and manual unlocking, queue filtering, resignation routing, moved-role aliases and mobile layout.

## R2 portrait storage

`scripts/r2_photos.py` uploads only linked bishop and pastor portraits, then checks object size and SHA-256 metadata. It uses content-addressed keys and preserves local originals. Install `boto3` in a local Python environment and provide credentials in `~/.config/drogs/r2.env` with owner-only permissions:

```text
R2_ACCOUNT_ID=your-account-id
R2_BUCKET=drogs
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
```

Run `python scripts/r2_photos.py --probe`, then `python scripts/r2_photos.py`. Successful uploads generate `data/photo-storage.json`. Set its `publicBaseUrl` to the bucket’s actual public HTTPS address after verifying anonymous image access, then rebuild. The S3 API endpoint is not a public image address. With no verified public address configured, the website continues loading the existing local portraits. Payment proof and source workbooks are never part of this upload.

All 3,431 linked portraits have been uploaded to R2 and verified for object size and SHA-256 metadata. Live image links remain local until the bucket’s public development URL is supplied and anonymous image access is verified.

Question definitions are versioned; older submissions retain the wording in `data/question-history.js`. The annual/monthly choice records a payment preference and does not create recurring payments.

Portraits use proportional cover framing with per-image face positions in `data/portrait-framing.json`. The local macOS Vision helper `scripts/portrait-framing.swift` detects face rectangles for framing only; it does not identify people or alter source images.
