# WinCapture Azure deployment

## Architecture and request flow

WinCapture is deployed as one Linux Azure App Service running ASP.NET Core 10. The Release publish includes the React build at `/`, the Angular build under `/angular/`, the Entra redirect bridge at `/redirect.html`, and the API under `/api/*`. Keeping the applications on one HTTPS origin preserves the shared MSAL session storage and avoids browser CORS for the normal deployment. App Service serves the React and Angular single page application fallbacks; the API and Angular calls use the same origin. The Vite `/angular` proxy is development-only.

The App Service system-assigned managed identity reads private Blob Storage using `Storage Blob Data Contributor`. It connects to Azure SQL using Microsoft Entra managed identity and TLS. SQL ingress is limited to the App Service outbound IP addresses by the Bicep firewall rules. Application Insights receives server telemetry. The API enforces a per-Entra-user (or fallback client IP) limit of 300 requests per minute. GitHub Actions validates changes on pull requests and has a separate manual production deployment workflow using OIDC.

## Resources and provisioning

`infra/main.bicep` provisions a Linux App Service plan and app, an integration VNet/subnet with the Storage service endpoint, Azure SQL server/database with Entra-only administration, a private blob container with public access disabled, a Log Analytics workspace, and Application Insights. Storage accepts traffic only from the integration subnet. SQL has no broad firewall rule; the template adds the App Service outbound IP addresses. Review SKU/cost and region choices before provisioning.

Key Vault is not included because application access uses managed identity, GitHub uses OIDC, and the SPA contains only public Entra identifiers. If a future integration requires a server-side secret, store it in Key Vault and grant the App Service identity only secret-read access.

Example (replace every angle-bracket value; use resource names that meet Azure naming rules):

```powershell
az group create --name <resource-group> --location <azure-region>
az deployment group create --resource-group <resource-group> --template-file infra/main.bicep --parameters appName=<unique-app-name> storageName=<unique-storage-name> sqlServerName=<unique-sql-name> appServicePlanName=<plan-name> tenantId=<entra-tenant-id> entraApiClientId=<api-app-client-id> sqlEntraAdminObjectId=<admin-object-id> sqlEntraAdminName=<admin-user-name>
```

The App Service managed identity must be made a contained Azure SQL database user and granted only the application DML permissions. Connect as the configured Entra SQL administrator and run:

```sql
CREATE USER [<app-service-managed-identity-name>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<app-service-managed-identity-name>];
ALTER ROLE db_datawriter ADD MEMBER [<app-service-managed-identity-name>];
```

If the application must execute migrations itself in a controlled release, grant the migration identity the additional DDL permission only for that operation; do not leave it as SQL server administrator. The template currently gives the runtime identity reader/writer access, so a separate deployment identity is the preferred owner for migrations.

## Microsoft Entra setup

Use the existing registration values where they match this application; do not create new IDs in source code. Store the **SPA client ID**, **API client ID**, and **tenant ID** as public build values. The SPA client and API can be separate registrations; the values must be configured consistently.

1. In the API app registration, set the Application ID URI to `api://<API_CLIENT_ID>` (or preserve the existing URI and use it consistently).
2. Expose delegated scope `access_as_user`. The API accepts a Microsoft Entra delegated access token with this scope and the API audience.
3. Define enabled app roles `WinCapture.User` and `WinCapture.Admin`, allowed member type `Users/Groups`. Assign named users/groups to the API enterprise application roles. The API maps exactly one of these roles to a WinCapture database profile; no role means no application access.
4. In the SPA registration, add the SPA platform and exact production redirect and logout URIs `https://<APP_SERVICE_HOST>/` and `https://<APP_SERVICE_HOST>/redirect.html`. Add the corresponding localhost URIs only to the development registration/platform configuration if needed. Do not add a client secret to a SPA.
5. Add API permission `api://<API_CLIENT_ID>/access_as_user` as a delegated permission to the SPA registration and grant consent per tenant policy. Ensure API role claims are present in access tokens issued for the API.
6. Configure the API registration as an API (not a SPA) for bearer-token validation. `AzureAd:TenantId` and `AzureAd:ClientId` refer to the tenant and API registration. No local password flow or WinCapture-issued JWT is used.

The React and Angular MSAL clients share the same browser origin and session cache. React uses the origin root for sign-in; Angular reads the same account and silently obtains the `access_as_user` token. Both attach the Microsoft bearer token to API requests.

## Configuration

All build values prefixed `VITE_` are public and are embedded into browser assets. Copy `frontend/.env.example` to `frontend/.env.production` for a local production build. Never put credentials, client secrets, SQL credentials, storage keys, or tokens in these values.

| Setting | Purpose |
| --- | --- |
| `VITE_MSAL_CLIENT_ID` | SPA application client ID |
| `VITE_MSAL_TENANT_ID` | Entra tenant ID |
| `VITE_MSAL_API_SCOPE` | Full delegated API scope, normally `api://<API_CLIENT_ID>/access_as_user` |
| `VITE_API_BASE_URL` | Blank for same-origin API; otherwise an HTTPS API origin and matching backend CORS setting |
| `VITE_MSAL_REDIRECT_URI` | Optional absolute SPA redirect; blank uses the deployed site's origin |
| `VITE_MSAL_POST_LOGOUT_REDIRECT_URI` | Optional absolute logout target; blank uses the deployed site's origin |
| `VITE_ANGULAR_ALBUMS_URL` | Optional Angular URL; blank resolves to `/angular/albums` |

The production Angular build receives the Entra public settings through a generated `runtime-config.js` in `/angular`; it contains no secret. Its API base is blank for same-origin hosting. Set App Service settings through Bicep or the Azure configuration store, not source files:

| App Service setting | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | `true` |
| `AzureAd__TenantId` | Entra tenant ID |
| `AzureAd__ClientId` | API application client ID |
| `AzureAd__Instance` | `https://login.microsoftonline.com/` |
| `ConnectionStrings__WinCaptureDatabase` | Azure SQL connection string using `Authentication=Active Directory Managed Identity`, encryption enabled, and the provisioned database name |
| `Storage__ServiceUri` | `https://<storage-account>.blob.core.windows.net` |
| `Storage__ContainerName` | `wincapture` |
| `Cors__AllowedOrigins__0` | Exact trusted frontend origin, for example the actual App Service HTTPS origin |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Application Insights connection string (not a browser setting) |

`Storage:ConnectionString` remains supported for local development only. Production startup requires the Blob service URI and uses `DefaultAzureCredential`; anonymous blob access and shared-key access are disabled by the template.

## Database initialization and upgrades

The migration history currently contains `InitialCreate`. Do not run `database/WinCaptureDb.sql` against production: it is a legacy local schema and does not match the Entra-based EF model. Back up any existing database and compare its schema before deciding whether to migrate or create a fresh database.

Review and generate an idempotent migration script:

```powershell
dotnet tool install --global dotnet-ef --version 10.0.11
dotnet ef migrations script --idempotent --project backend/WinCapture.csproj --output database/WinCaptureDb.sql
```

Have a DBA review the script, take a restorable backup, and apply it with an Entra-authenticated SQL deployment identity before deploying an app version that needs the migration. The API intentionally does not call `Database.Migrate()` at startup. Keep the script and migration source in the reviewed change. Do not drop or recreate production data to resolve schema drift.

## Build and CI/CD

From the repository root, restore/build/test the API with `dotnet restore WinCapture.slnx`, `dotnet build WinCapture.slnx -c Release`, and `dotnet test Tests/backend.Tests/WinCapture.Tests.csproj -c Release`. React commands run in `frontend`: `npm ci`, `npm run lint`, `npm test`, `npm run build`. Angular commands run in `frontend-angular`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build:production`.

The manual `.github/workflows/deploy-azure.yml` workflow runs validation, builds both frontends into the API's `wwwroot`, publishes the API, and deploys only after validation. It runs only from `workflow_dispatch`; pull requests never deploy. Set these repository/environment **variables** for the `production` GitHub environment: `AZURE_WEBAPP_NAME`, `VITE_MSAL_CLIENT_ID`, `VITE_MSAL_TENANT_ID`, `VITE_MSAL_API_SCOPE`, and optionally `VITE_API_BASE_URL`. Configure an Azure federated credential with subject `repo:<owner>/<repo>:environment:production` and audience `api://AzureADTokenExchange`. Add protected environment secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. Grant that service principal the minimum resource-group deployment rights needed for App Service deployment. Azure/login uses OIDC; there is no publish-profile secret.

The deployment package does not apply database migrations or rewrite App Service settings. Apply reviewed migrations and configure settings before dispatching the workflow. Save the previous successful package artifact/release for rollback. Redeploying a prior package is safe only when the database schema remains compatible; restore a database backup if an upgrade is not backward compatible.

## Verification and troubleshooting

After deployment, verify `/health/live` returns 200 and `/health/ready` returns 200 (database reachable), `/` loads React, `/dashboard` survives refresh, `/angular/albums` and a refresh on that route load Angular, and Angular JS/CSS assets return 200 under `/angular/`. Confirm `/api/auth/me` returns 401 without a token, the correct user profile with a valid delegated token, and 403 for a signed-in account without an assigned WinCapture role. Check Application Insights for traces and failed dependencies without exposing bearer tokens or file contents.

Sign in through Entra, verify token acquisition for `access_as_user`, then test file upload at 10 MB and over 10 MB, preview, download, replacement, deletion, favorites, album creation, album sharing and viewer/manager permissions. Verify an unauthorized user cannot access a guessed file/album ID. Confirm blobs remain private in the Storage account. Check App Service outbound addresses against the SQL firewall after scale/plan changes; update firewall rules if Azure changes them. A readiness failure commonly indicates a missing SQL contained user, SQL firewall change, or invalid managed-identity connection setting. A storage 403 usually indicates missing Blob Data Contributor assignment or blocked VNet access. A 401/403 on API calls usually indicates wrong API audience/scope or missing app role assignment.

## Remaining manual actions

- Provision the Azure resources and configure the SQL contained user/roles.
- Confirm Entra SPA redirect URIs, API scope, role definitions, assignments, and consent in the tenant.
- Review whether the current database is a legacy database before applying EF migrations; take a backup.
- Configure the protected GitHub `production` environment, variables, OIDC federated credential, and approval policy.
- The ignored local `backend/appsettings.Development.json` contains a Storage account key. It is not tracked or used by the production setup, but rotate that key if it has been shared or used outside local development, then move local credentials to user secrets or use developer managed identity.
- Run post-deployment verification above. No production resources are provisioned or modified by repository changes.
