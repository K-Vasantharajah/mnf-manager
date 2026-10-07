# Secrets and configuration

Where each secret lives, what uses it, and what to update if it changes.

Nothing in this file is a secret itself. It records _where_ they are, not
what they are.

## Inventory

| Secret                              | Local                                                                      | Production                                                                                                                                                   | Used by                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Database password (`mnf`)           | `application-secrets.yml`, and the local Postgres container's own password | `db-password` secret → `SPRING_DATASOURCE_PASSWORD` (**mnf-backend**); embedded in the `database-url` secret (**mnf-ratings-job**)                           | Backend, ratings job, `update_ratings.py` run by hand                                                |
| Demo database password (`mnf_demo`) | Not needed: the local demo uses the local `mnf` user                       | `demo-db-password` secret → `SPRING_DATASOURCE_PASSWORD` (**mnf-backend-demo**)                                                                              | Demo backend                                                                                         |
| JWT signing key                     | `application-secrets.yml`                                                  | `jwt-secret` secret → `JWT_SECRET` (**mnf-backend**)                                                                                                         | Backend                                                                                              |
| Demo JWT signing key                | `JWT_SECRET` env var when running the demo locally                         | `demo-jwt-secret` secret → `JWT_SECRET` (**mnf-backend-demo**)                                                                                               | Demo backend. **Must differ from the real one**, or demo tokens would work against the real backend. |
| MNF access code                     | BCrypt hash in `application-secrets.yml`                                   | `mnf-access-code-hash` secret → `MNF_ACCESS_CODE_HASH` (**mnf-backend**)                                                                                     | Backend. The demo deliberately has none.                                                             |
| Google client ID                    | `application-secrets.yml` (backend), `.env.local` (frontend)               | `GOOGLE_CLIENT_ID` env var (backend), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` GitHub secret (frontend build)                                                          | Backend, frontend                                                                                    |
| Admin emails                        | `application-secrets.yml` (`app.admin-emails`)                             | `ADMIN_EMAILS` env var                                                                                                                                       | Backend                                                                                              |
| Azure service principal             | —                                                                          | Four GitHub secrets: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`                                                    | GitHub Actions                                                                                       |
| ACR admin credentials               | —                                                                          | Azure Container Registry → Access keys; copied into the registry settings of **mnf-backend**, **mnf-frontend**, **mnf-backend-demo** and **mnf-ratings-job** | Image pulls                                                                                          |

## Rotating the database password

This is the one with the most copies, and getting it wrong takes the app down.

1. Portal → **mnf-manager-db** → Reset password
2. Verify before changing anything else:

```bash
   psql "host=mnf-manager-db.postgres.database.azure.com port=5432 dbname=mnfmanager user=mnf sslmode=require" -c "select 1;"
```

3. Open **mnf-backend** in the portal, search its menu for **Secrets**, and update
   `db-password`
4. Do the same on **mnf-ratings-job** for `database-url` (the password is embedded
   in the connection string)
5. Restart any backend revision that was already failing. Editing a secret does
   not restart a crashed revision. The job reads its secret fresh on each run.
6. Update wherever you keep it locally for `update_ratings.py`

Step 4 matters most. In September 2026 the equivalent step was missed for the
then ML service: it kept working until its container was next replaced, then
every database call failed. For the job, a missed update would show up as a
failed 06:00 run, which the job-failure alert reports.

The demo is unaffected: it connects as `mnf_demo`, with its own password.

## Rotating the ACR credentials

Regenerating the registry's admin password breaks image pulls for every app that
stores it. Update the registry password on **mnf-backend**, **mnf-frontend**,
**mnf-backend-demo** and **mnf-ratings-job**: open each in the portal and search
its menu for **Registries**. Or from the CLI, `az containerapp registry set` for
the apps and `az containerapp job registry set` for the job.

## Recreating the demo database user

If the demo database is ever rebuilt, the admin user must be granted the demo role
before it can hand over ownership. Without that, the demo fails at startup with
`permission denied for schema public`:

```sql
CREATE ROLE mnf_demo LOGIN PASSWORD '...';
GRANT mnf_demo TO mnf;
ALTER DATABASE mnfmanager_demo OWNER TO mnf_demo;
REVOKE CONNECT ON DATABASE mnfmanager FROM PUBLIC;
GRANT CONNECT ON DATABASE mnfmanager TO mnf;
-- then, connected to mnfmanager_demo:
ALTER SCHEMA public OWNER TO mnf_demo;
```

## Frontend build-time variables

`NEXT_PUBLIC_*` values are inlined into the JavaScript bundle at build time, not
read at runtime. Setting them as container environment variables has no effect.
They must be passed as `--build-arg` when the image is built, which the pipeline
does for `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_API_URL` and
`NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Local vs production

Locally, the backend reads secrets from `application-secrets.yml`, which is
gitignored and excluded from Docker images. Production reads everything from
Azure Container App secrets and environment variables, so CI-built images, which
never have that file, behave identically.

## Notes

- The Azure service principal's client secret expires on **<24/09/2027>**. Renew it
  in Microsoft Entra ID → App registrations → `mnf-manager-github-actions` →
  Certificates & secrets before then, or deployments will start failing.
- The access code can be rotated without logging anyone out: existing member
  tokens are signed with the JWT secret, not the code, so they remain valid
  until they expire.
