# Move GlobePilot data from Seoul to the EU

The live project is **Northeast Asia (Seoul) `ap-northeast-2`**, compute `t4g.nano`. Disk is tiny (~4%), so a dump/restore is the right path. Supabase cannot change region in place.

Recommended destination: **Central EU (Frankfurt) `eu-central-1`**. That is the closest EU region to Bulgaria and matches a PostHog EU project.

This app does not use Supabase Storage objects in code. Auth is NextAuth plus tables in Postgres (`lib/auth.ts`), not hosted Supabase Auth as the primary login. A logical dump of roles, schema, and data is enough if you also copy Auth provider settings if any exist in the dashboard.

## Order of work

1. Create the **PostHog EU** project and wire tokens. Analytics does not live in Supabase.
2. Keep shipping product on the Seoul project.
3. Migrate Supabase in a quiet hour (plan 30–60 minutes of write freeze).

Do not delay PostHog until after the database move.

## Legal note

South Korea has an EU adequacy decision, so Seoul is not automatically unlawful for GDPR. Moving to Frankfurt still helps: one EU region for personal data, simpler privacy text, and lower latency from Europe. Update `/privacy` after the cutover to say data is stored in the EU.

## Migrate the database

### 1. Inventory the Seoul project

In the current dashboard, note:

- Project ref (the subdomain of `*.supabase.co`)
- Postgres version
- Enabled extensions
- Auth providers / Google OAuth callback URLs
- Any cron, webhooks, or Realtime publications
- Database password (reset it if unknown)

### 2. Create the Frankfurt project

1. [New project](https://database.new) in the **same** Supabase org.
2. Region: **Central EU (Frankfurt)** / `eu-central-1` (not a vague “Europe” grouping if you need a specific jurisdiction).
3. Save the new database password.
4. Enable the same extensions as Seoul.
5. Do **not** point Vercel at it yet.

### 3. Dump Seoul

Install the [Supabase CLI](https://supabase.com/docs/guides/cli). Use the **direct** `db.` connection string if IPv6 works; otherwise the session pooler string from **Connect**.

```powershell
$OLD = "postgresql://postgres.[OLD-REF]:[OLD-PASSWORD]@db.[OLD-REF].supabase.com:5432/postgres"

npx supabase db dump --db-url $OLD -f roles.sql --role-only
npx supabase db dump --db-url $OLD -f schema.sql
npx supabase db dump --db-url $OLD -f data.sql --use-copy --data-only
```

Keep `roles.sql`, `schema.sql`, and `data.sql` off git.

### 4. Freeze writes, dump again, restore

1. Put the site in a short maintenance window or pause crons (`vercel.json` crons and `/api/cron/*`).
2. Re-run the three dumps so you do not miss rows written after the first dump.
3. Restore into Frankfurt:

```powershell
$NEW = "postgresql://postgres.[NEW-REF]:[NEW-PASSWORD]@db.[NEW-REF].supabase.com:5432/postgres"

psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command "SET session_replication_role = replica" --file data.sql --dbname $NEW
```

If restore errors on `ALTER ... OWNER TO "supabase_admin"` or `GRANT "postgres" TO "cli_login_postgres"`, comment those lines in `roles.sql` / `schema.sql` and retry. Official notes: [Backup and Restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

4. Spot-check row counts for `users`, `price_alerts`, `user_events`, `email_subscribers`, and any trip/passport tables against Seoul.

### 5. Point the app at Frankfurt

Update Production + Preview + `.env.local` (do not commit secrets):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and publishable key if you use it)
- service-role / secret key used by server routes

If Google OAuth is enabled, add the new callback URL in Google Cloud:

`https://globepilots.com/api/auth/callback/google`

Redeploy Vercel. Confirm login, a price alert, and that `/api/admin/analytics` still loads.

### 6. Keep Seoul as rollback

Leave the Seoul project **paused**, not deleted, for at least a week. If Frankfurt misbehaves, revert the env vars. After you are confident, delete Seoul so personal data is not sitting in two regions.

## What this does not copy

Copy or recreate by hand if you use them: Edge Functions, Storage buckets, Auth dashboard settings, Realtime publications, database webhooks, Vault encryption keys.

GlobePilot currently has no Storage usage in the repo.
