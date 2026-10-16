# Forma Studio — public website & CRM foundation

Next.js App Router, TypeScript, Tailwind CSS 4 and Supabase. The public website runs without credentials. CRM routes and intake fail closed until configured. There is no production seed data, sample customer account, or embedded secret.

## 1. Install and preview

Use Node.js 22.18+ (Node 24 recommended). Tests use Node's built-in TypeScript stripping and test runner.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open http://localhost:3000. On shells without PowerShell's execution restriction, `npm` works in place of `npm.cmd`. The landing page, design studies, studio, services and contact pages are available immediately. Branding and reference photography are a design foundation; replace them with the firm's approved identity and licensed project photography before launch.

## 2. Create the database

Create a Supabase project, or use the Supabase CLI with Docker for a disposable local instance. Run `supabase/migrations/202610160001_foundation.sql` once via the SQL Editor, or `supabase db push` after linking the CLI project. The migration must run as the database owner. Do not add `app_private` to the exposed API schemas.

The migration creates profiles, leads, notifications, append-only application audit logs, RLS policies, role checks, invitation profile provisioning, and transactional intake throttling. It includes no fake production data.

## 3. Configure .env.local

- `NEXT_PUBLIC_SUPABASE_URL`: project URL from Supabase project settings.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key. This is intentionally public; RLS protects records.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service-role key from project API settings. Never use a `NEXT_PUBLIC_` prefix. Its only application use is the bounded intake RPC.
- `RATE_LIMIT_SECRET`: independently generated random secret of at least 32 bytes. Generate locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and paste into `.env.local` or your deployment secret manager. Never commit the value.
- `APP_ORIGIN`: exact browser origin, e.g. `http://localhost:3000` or your production HTTPS origin. Requests from another origin are rejected.

Restart Next.js after configuration changes. Commit only `.env.example`; `.env.local` is ignored. Set production environment variables separately in the hosting dashboard. Never put keys into command arguments, screenshots, source code, or issue descriptions.

## 4. Configure authentication and invite users

In Supabase Auth settings, disable public sign-up. Set Site URL to `APP_ORIGIN`, configure your production SMTP provider, and enable suitable password strength, leaked-password protection, email confirmation and auth rate limits. The app uses cookie-based SSR authentication and validates users on the server for every protected read and mutation; it does not trust editable user metadata for roles.

For the Invite User email template, use this confirmation URL:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
```

For the recovery template use the same URL with `type=recovery`. Restrict Supabase redirect URLs to your explicit development and production URLs; do not use wildcard production domains. The confirmation route accepts only invite/recovery tokens and redirects to `/account` to choose a password. Failed or expired links lead back to sign-in. Recovery is initiated by studio staff in Supabase; no public recovery form is included in this phase.

Invite real customers and administrators from Supabase Auth. Each auth user automatically receives the `customer` profile role. To bootstrap an administrator, run the following in the trusted SQL Editor, replacing the placeholder with an existing, verified auth user's UUID:

```sql
update public.profiles set role = 'admin' where id = '<verified-auth-user-uuid>';
```

This change is audited. Browser clients cannot update profile roles. Admins sign in at `/login`, then open **Studio dashboard** in `/portal` (or go directly to `/admin`). Customers use `/portal`.

A signed-in consultation is linked to the verified session's user ID. Guest requests stay unlinked. Admins may link a guest request using **View & manage → Link verified customer account** after independently confirming identity and copying that customer's UUID from Supabase Auth. Matching an email address alone never grants access.

## 5. Validate

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

Unit tests cover input normalization, consent, honeypot rejection, field bounds, role/ownership injection, status values and concurrency inputs. To exercise the actual database permissions and triggers, apply the migration to a disposable local Supabase instance and run:

```powershell
psql "<local-supabase-postgres-connection-string>" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
```

Use a local connection only. The SQL suite inserts transaction-scoped fixtures, checks anonymous denial, customer isolation, privilege escalation, admin access, audit writes, notification isolation, ownership revocation and intake limits, then rolls back. It is not a production seed. Do not run this test file against a live customer database.

Manual acceptance: submit a real test inquiry in a staging environment; verify the admin's notification and lead; move it through stages; link it to the correct test customer; confirm another customer cannot read it; mark a notification read; verify sign-out and protected-route redirects. Test invitation expiry, a wrong password, provider outage, mobile navigation, keyboard focus, and form errors. Clear staging test records according to your process.

## Deployment requirements and scope

- Host on a Node-compatible Next.js platform with HTTPS. Do not put a shared cache in front of authenticated pages or cache `Set-Cookie` responses. The proxy adds `private, no-store` and refreshes sessions; all CRM pages are dynamic.
- The public intake limiter allows five successful requests per IP and three per email per hour in PostgreSQL, including across app instances. `x-forwarded-for` must be overwritten by a trusted ingress proxy. Strip client-supplied forwarded headers. Without an IP, a conservative shared `unknown` bucket is used. Add edge rate limits/WAF protection before accepting public traffic, particularly for malformed requests and authentication. Supabase handles password-login rate limits.
- No automatic email sending or outbound messaging is implemented. Notifications are persistent in-app records loaded on navigation/refresh, not live subscriptions. They show the latest 30; leads show the latest 500, customer requests the latest 100, and audit activity the latest 20. Metrics explicitly describe the loaded set. Add server-side pagination and database aggregate counts for larger workloads.
- CRM intentionally grants only status updates and verified customer linking. Full contact editing, notes, attachments, project delivery, billing, team invitations and advanced reporting are future phases. Account recovery is staff-assisted. Admin MFA is a launch hardening task; enforce it in both route checks and RLS if required by your organization.
- The studio must finalize its legal identity, privacy contact, retention periods, deletion/export process, backup/restore policy, observability and incident response before production intake. Schedule cleanup of stale intake hashes if no submissions arrive (the RPC prunes records older than 24 hours on each successful admission).
- The role of database owner and service key remains privileged. Restrict dashboard access, rotate secrets, and monitor audit events. Application audit rows cannot be edited or deleted by customers or admins through the Data API; database owners remain capable of maintenance.

See [docs/architecture.md](docs/architecture.md) for boundaries and the next implementation steps.
