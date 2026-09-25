# D.R.O.G.S external API

Implementation prepared for Supabase Edge Functions and PostgreSQL. **Not deployed or connected to the live browser app yet.** The current app still keeps submissions in browser localStorage. The API's records table starts empty; it must not be presented as live cross-device submission data until the app's storage integration is completed.

## Access model

All data requests require `Authorization: Bearer <D.R.O.G.S key>`. Keys are generated from 32 random bytes; only SHA-256 hashes are stored in the database. Every key has an expiry, revocation state, explicit scopes, optional role restrictions, and optional organization restrictions. Restrictions apply before list pagination and to guessed individual IDs. The database rejects access from ordinary Supabase publishable credentials through RLS and grants. The Edge Function enforces the D.R.O.G.S key on every non-OPTIONS request. An authenticated key is limited to 60 requests per minute with a database-backed atomic quota.

The initial key is prepared locally with **directory:read only**, expires after 90 days, and has not been activated on a server. Raw keys and activation records are in `.private/`, excluded from Git. Never put a raw key or Supabase server key in the frontend, a public sheet, source control, or an image URL. Request logs contain key IDs, routes and status codes, not secrets or private answers.

| Scope | Endpoint | Access |
|---|---|---|
| `directory:read` | `GET /v1/people`, `GET /v1/people/B4` | Names, separate titles, roles, organizations, denominations, country, image/logo references |
| `profiles:read` | `GET /v1/people/B4/profile` | Age, profession and other personal/ministry profile fields |
| `contacts:read` | `GET /v1/people/B4/contacts` | Mobile, WhatsApp, email and address |
| `applications:read` | `GET /v1/people/B4/application` | Submission status and timestamps |
| `application-answers:read` | Same application endpoint, also requires `applications:read` | Declaration answers and confidential disclosures |
| `payments:read` | `GET /v1/people/B4/payment` | Recorded payment status and metadata; no screenshot |
| `payment-proofs:read` | `GET /v1/people/B4/payment-proof` | A private screenshot URL expiring after 60 seconds |
| `reviews:read` | `GET /v1/people/B4/review` | Review status |
| `review-notes:read` | Same review endpoint, also requires `reviews:read` | Internal review note |

`GET /v1/scopes` returns only the calling key's grants, restrictions and expiry. External keys are read-only. They cannot alter people, mark payments paid, approve applications, or create other keys.

List filters: `role=bishop|pastor`, `organization=UD-OLGC|UO-FLC190`, `denomination`, `country`, `q`, `limit` (1–100) and `offset`. Empty restriction arrays mean both roles/all organizations; a key's configured restrictions can never be widened with query parameters. Organization and group counts remain provisional until source roster reconciliation is completed.

## Deploy and activate

1. Select a Supabase project. Apply `supabase/migrations/202609250001_drogs_api.sql` using the project's SQL editor or the Supabase CLI. The migration creates protected directory, record, key and audit tables, the quota function, and a private `payment-proofs` bucket.
2. Link the project and deploy `supabase functions deploy drogs-api`. `supabase/config.toml` disables the platform JWT check because the handler performs mandatory scoped-key authentication. Do not remove that authentication.
3. Configure `DROGS_ALLOWED_ORIGIN=https://jkgbafa.github.io`. The function uses the injected Supabase server keys, or a project secret named `DROGS_SUPABASE_SERVER_KEY`. Never expose those keys externally.
4. Set `DROGS_SUPABASE_URL`, `DROGS_SUPABASE_SERVER_KEY` and `DROGS_KEY_RECORD_FILE=.private/directory-key-record.json` in your local shell environment, then run `node scripts/import_api_directory.mjs`. This imports the current directory and activates only the hashed key record. No browser submissions are invented or seeded.
5. The endpoint is `https://<your-project>.supabase.co/functions/v1/drogs-api/v1/people`. Verify missing-key rejection and the directory-only key's denial of contact/application access before sharing the key privately.

The import uses upserts to preserve records. For subsequent roster removals, explicitly remove the corresponding `drogs_people` row only after checking dependent submitted records; do not silently delete application history.

To generate a different restricted key locally:

```sh
node scripts/create_api_key.mjs --label='First Love directory partner' --scopes=directory:read --roles=bishop --organizations=UO-FLC190 --days=30 --output=first-love-partner
```

Import its `*-record.json` to activate it. Revoke through the administrative database connection:

```sql
update public.drogs_api_keys set revoked_at = now() where id = '<key-id>';
```

Run `node --test tests/api.test.mjs` for scope, expiry, revocation, organization/role boundaries, private-field projection, pagination, rate-limit and CORS checks. These tests use fixture storage; hosted PostgreSQL/RLS and storage signing must also be verified after a project is connected.

## Remaining app migration

The existing GitHub Pages JavaScript contains directory data and its PIN is a client-side gate. The new API does not retroactively protect those public files. Move confidential directory fields and submissions behind authenticated server routes, implement participant/admin sign-in, and remove public private-field bundles before describing the system as private or cross-device. Keep human-readable B/P codes as record identifiers, not authentication secrets. Payment proof upload alone is not independent bank confirmation.

References: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
