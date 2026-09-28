# Secrets and configuration

Where each secret lives, what uses it, and what to update if it changes.

Nothing in this file is a secret itself — it records *where* they are, not
what they are.

## Inventory

| Secret | Local | Production | Used by |
|---|---|---|---|
| Database password | `application-secrets.yml`, and the local Postgres container's own password | `db-password` secret → `SPRING_DATASOURCE_PASSWORD` (backend), and inside `database-url` (ML service) | Backend, ML service, `update_ratings.py` |
| JWT signing key | `application-secrets.yml` | `jwt-secret` secret → `JWT_SECRET` | Backend |
| MNF access code | BCrypt hash in `application-secrets.yml` | `mnf-access-code-hash` secret → `MNF_ACCESS_CODE_HASH` | Backend |
| Google client ID | `application-secrets.yml` (backend), `.env.local` (frontend) | `GOOGLE_CLIENT_ID` env var (backend), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` GitHub secret (frontend build) | Backend, frontend |
| Admin emails | `application-secrets.yml` | `ADMIN_EMAILS` env var | Backend |
| Azure service principal | — | Four GitHub secrets: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | GitHub Actions |
| ACR admin credentials | — | Azure Container Registry → Access keys | Manual `docker login`, if ever needed |

## Rotating the database password

This is the one with the most copies, and getting it wrong takes the app down.

1. Portal → **mnf-manager-db** → Reset password
2. Verify before changing anything else:
```bash
   psql "host=mnf-manager-db.postgres.database.azure.com port=5432 dbname=mnfmanager user=mnf sslmode=require" -c "select 1;"
```
3. Update **mnf-backend** → Secrets → `db-password`
4. Update **mnf-ml-service** → Secrets → `database-url` (the password is embedded
   in the connection string)
5. Restart any revision that was already failing — editing a secret does not
   restart a crashed revision
6. Update wherever you keep it locally for `update_ratings.py`

Step 4 is the one that was missed in September 2026. The ML service kept working
until its container was next replaced, then every route returned 500 because
every database call failed.

## Frontend build-time variables

`NEXT_PUBLIC_*` values are inlined into the JavaScript bundle at build time, not
read at runtime. Setting them as container environment variables has no effect.
They must be passed as `--build-arg` when the image is built, which the pipeline
does for both `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Local vs production

Locally, the backend reads secrets from `application-secrets.yml`, which is
gitignored and excluded from Docker images. Production reads everything from
Azure Container App secrets and environment variables, so CI-built images — which
never have that file — behave identically.

## Notes

- The Azure service principal's client secret expires on **<24/09/2027>**. Renew it in
  Microsoft Entra ID → App registrations → `mnf-manager-github-actions` →
  Certificates & secrets before then, or deployments will start failing.
- The access code can be rotated without logging anyone out: existing member
  tokens are signed with the JWT secret, not the code, so they remain valid
  until they expire.
