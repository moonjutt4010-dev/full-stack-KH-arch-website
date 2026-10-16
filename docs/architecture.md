# Architecture and implementation sequence

## Delivered foundation

1. Public server-rendered website: responsive home, work studies, expertise, studio, consultation and privacy pages. Only form/CRM interactions use client components. Tailwind 4 utilities are paired with a shared visual stylesheet. No externally downloaded font is needed to build.
2. Supabase schema and least-privilege grants: profiles (`customer` or `admin`), leads, per-user notifications, audit logs, and private hashed intake counters. All tables have RLS. Public visitors have no table access. User-controlled auth metadata never provisions roles.
3. Authentication: invitation/recovery token verification, password setup, sign-in and sign-out. SSR cookies are refreshed through Next.js 16 `proxy.ts`. `requireUser` validates with `getUser` and loads the database role. Protected pages and every mutation repeat authorization; the proxy is not the authorization boundary.
4. Consultation intake: same-origin JSON POST, bounded streamed body, strict Zod validation, honeypot, affirmative privacy consent, HMAC identifiers, and a service-only admission function. Owner IDs come only from a verified session. RPC admission serializes a short transaction and applies cross-instance hourly limits. Database constraints defend the persistent boundary as well.
5. CRM: admin-only lead list/search/status filters and pipeline; optimistic concurrency check on status changes; customer assignment through a role-checked RPC; per-recipient notifications with mark-read; recent audit events. No records are returned by public routes.
6. Tests: executable TypeScript validation tests and an isolated SQL regression suite for RLS, grants, trigger effects and rate limits. Build/type checking verifies the App Router integration. Database integration requires a configured local Supabase instance.

## Data model

| Table | Purpose | Access |
| --- | --- | --- |
| profiles | Auth ID, database role, creation time | Own profile or admin read; role provisioning by trusted SQL only |
| leads | Contact, project brief, stage, explicit customer ownership, consent timestamp/version | Customer reads own; admin reads all and updates status only |
| notifications | Recipient, associated lead, safe message, read time | Only recipient can read and change `read_at` |
| audit_logs | Actor, event, entity ID, bounded metadata, timestamp | Admin reads; trigger-only app writes; no app update/delete |
| app_private.intake_attempts | HMAC IP/email identifiers and submission timestamps | Not exposed through Data API; trusted intake function only |

Foreign keys relate profile IDs to Supabase Auth users and requests to their assigned owner. Revoking request ownership removes the previous owner's request notifications. Audit metadata omits briefs and contact information, but includes IDs and stage/assignment changes. Do not treat it as anonymous data. Indexes support recipient, customer, stage and time ordering.

## Trust boundaries

- Public site content is static editorial copy and clearly labeled concept photography, separate from CRM records.
- Browser requests are untrusted, including form fields, user metadata, record IDs and forwarded headers. An HTTPS ingress must overwrite the forwarded-IP header for per-IP enforcement.
- User-scoped Supabase clients retain RLS for all CRM queries and writes. The service-role client is confined to the intake module and never reads customer records.
- PostgreSQL owns profile role authorization. Security-definer functions use an empty search path and schema-qualified references; execution grants are explicit. Direct anonymous intake and role mutation are denied.
- Lead writes, audit logs and notifications are transactional. Failed writes do not claim success. Status changes compare previous state to prevent silently overwriting another administrator's update.
- Server Actions provide Next.js origin protection for authenticated mutations. The public route independently checks the configured origin, payload size, content type and schema. This is abuse reduction, not authentication for public visitors.

## Next phases

1. Verify against a staging Supabase project and run the SQL suite in local CI; generate database TypeScript definitions from that schema and use them in the client factory.
2. Add server pagination, full-dataset aggregation, read/unread notification pagination and optional Supabase Realtime with the existing recipient policies.
3. Add admin MFA enforcement in server authorization and database policies, staff provisioning workflows, self-service recovery, structured redacted error telemetry, backups and a tested data retention job.
4. Model projects separately from leads; add assignment, private staff notes and customer-visible updates as separate tables and policies. Design each exposure explicitly before introducing attachments or Storage buckets.
5. Add browser acceptance tests against disposable Supabase and automate accessibility/mobile checks. Add edge bot controls if abuse levels justify CAPTCHA; keep the bounded DB intake and RLS underneath.

Primary implementation references: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), and this repository's bundled Next.js guides under `node_modules/next/dist/docs/`.
