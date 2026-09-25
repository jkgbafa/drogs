# DROGS annual registration

This branch replaces the renewal questionnaire with account-based annual registration, bishop-submitted pastor lists and an Unclaimed review queue. The previous portal remains at `https://jkgbafa.github.io/drogs/` and is preserved on `codex/renewal-archive-2026-09-25` in `jkgbafa/drogs`.

## Current delivery

The published preview operates as a clearly labelled **browser-only demo** until Supabase and email delivery are configured. The entrance password is still **1234**, on both the portal and `/admin/`. Email addresses select demo accounts; no message is sent and this is not secure authentication. Do not use real registration information in the demo. Demo uploads are stored in IndexedDB, while registrations use `drogs-registration-v1`. Neither the old `drogs-2027` key nor the reconciled legacy source data is read or overwritten by the new flow.

The application starts with **zero registrations**. The existing bishop names are reference choices only. The previous photos and datasets remain in the repository; they do not count as completed registrations. No existing account is silently created or approved.

## Registration and annual lists

- New and returning members enter an email address. Connected mode uses Supabase email OTP verification.
- Required details: role, full name, email, phone, date of birth, church, organization, and an official-attire photo. Pastors select a bishop, or enter a name if the bishop is missing.
- Organizations: First Love, United Denominations, DHMM, FLOW, Healing Jesus Campaign. Outreach is no longer a registration option.
- Drafts can be saved; applicants review details and confirm accuracy before submission.
- The office verifies bishop accounts and optionally links each account to the correct legacy bishop reference. Approval unlocks the bishop’s annual list and $100 USD commitment.
- Bishops paste one pastor per line, using `name,email,phone,church` (CSV or tab-separated). Each row needs a name and a valid email or phone. They can reconfirm the previous cycle’s active list, explicitly, or submit a fresh list.
- A pastor matches only the selected, approved bishop’s list in the current cycle, with a normalized exact name plus an email or phone match, and only when one unclaimed entry matches. Close spellings, name-only matches and ambiguous duplicates require confirmation.
- Unmatched registrations remain **Unclaimed**, shown in red in their own queue. They never appear in the main Directory until confirmed. The selected bishop or office can link an existing list entry or confirm a new entry. The office can correct the selected bishop.
- Confirmed pastors pay **$50 USD**. All commitments are explicitly **non-refundable**, with acknowledgement before payment proof submission. Payment screenshots require office verification; uploading an image never marks a payment as received.
- New MoMo/bank instructions have not yet been supplied. No invented account is displayed. Connected-mode payment uploads remain disabled until `NEXT_PUBLIC_PAYMENT_INSTRUCTIONS` is configured; the demo allows sample receipts.
- Removal requires Transferred, Resigned, Dismissed or Other (with explanation). Records and payments are retained, and removed pastors leave the active directory. Complex reinstatement/transfer corrections should be handled by the office; the present UI does not edit already submitted registration fields.
- Only the office can open the following annual cycle. Historical registration status is preserved; accounts persist; fresh registrations and payment records are required. Prior annual lists and payments are not automatically carried forward.

## Backend setup when keys are available

1. Create a Supabase project. Apply `supabase/migrations/202609250002_registration.sql` and `supabase/registration-reference-seed.sql`. A fresh registration-only project does not need the older API migration. Neither script erases existing data. The seed contains reference names, titles, organization labels and photo paths, not personal contacts or registrations.
2. Enable email authentication. In the Magic Link template include `{{ .Token }}` to send the one-time code used by this interface. Configure custom SMTP and appropriate delivery limits. Supabase’s default sender only sends to project-team addresses and is not sufficient for public registration.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the project URL and public publishable/anon key. Both are required. Never place a secret/service-role key in a `NEXT_PUBLIC_` variable.
4. An office member signs in to create their verified auth user. Add that exact user ID to `registration_office` using the Supabase SQL editor, e.g. `insert into public.registration_office(user_id) values ('VERIFIED-USER-UUID');`. There is no client-side office-role assignment in connected mode.
5. Configure `NEXT_PUBLIC_PAYMENT_INSTRUCTIONS` with confirmed Ghana payment details, then rebuild and deploy. The current static build supports Supabase directly; it does not require a Next.js server.
6. Test OTP delivery, office access, a bishop approval, a pastor registration, an Unclaimed resolution, and a private upload across two devices before rollout.

SQL writes go through `registration_action` with verified identity and role checks. Clients have no direct read/write privileges on registration tables. `registration_snapshot` scopes records to the applicant, selected bishop or office. Private images use a dedicated `registration-media` bucket with 5 MB JPEG/PNG/WebP limits and expiring signed URLs. Only the owner and office can read receipts; the selected bishop can read submitted pastor portraits. Legacy public R2 portraits remain untouched; new private registration images use Supabase Storage to keep authorization enforceable without requiring R2 service credentials in the browser. If its free storage allowance is exceeded, a server-side R2 upload/signing service or a larger storage allowance will be needed.

The entrance PIN is only a familiar navigation gate. In connected mode it cannot access the database or grant office privileges. Accounts sign out after 30 minutes without keyboard/pointer activity. SQL locking makes roster additions, claims and payment decisions atomic and prevents stale actions from overwriting already completed decisions.

## Develop and verify

```sh
npm ci
npm test                 # domain rules and actual PostgreSQL via PGlite
npm run test:legacy      # checks for preserved legacy modules/data
NEXT_PUBLIC_BASE_PATH=/drogs-registration npm run build
PORT=4207 NEXT_PUBLIC_BASE_PATH=/drogs-registration npm run serve
# In another terminal, with Python Playwright installed:
DROGS_BASE_URL=http://127.0.0.1:4207/drogs-registration python3 tests/registration/browser.py
```

Browser checks use isolated browser storage and sample accounts, preserving the legacy key. They cover registration/drafts, office bishop verification, roster import, Unclaimed exclusion from Directory, linking spelling differences, payment proof/verification, removal, cycle reset and desktop/mobile layouts. SQL tests assert rejected self-approval, wrong-bishop access, wrong-owner photo uploads, direct table access and unpaid/unauthorized payment attempts.

## Separate preview publishing

The source branch is `codex/annual-registration` in `jkgbafa/drogs`. CI validates it and produces a `registration-site` artifact; it has no permissions to replace the old Pages site. The separate `jkgbafa/drogs-registration` repository serves only the tested static export at `https://jkgbafa.github.io/drogs-registration/`. It contains no legacy directories or source contact data. Publish a tested `out/` build to that repository’s `main` branch, including `.nojekyll`. Only the mitre and two attire examples are copied into the public assets; original portrait files remain in the source repository.
