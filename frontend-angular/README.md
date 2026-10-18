# WinCapture Angular Albums

This standalone Angular app recreates the React Albums page and calls the existing ASP.NET Core API. Its Entra client ID, tenant, and delegated API scope are public SPA configuration values in `src/environments/environment.ts`; never add a client secret. `environment.example.ts` documents the fields to replace for another environment.

The currently registered callback is kept exactly as `http://localhost:4200/silent-redirect.html`. It is served as a standalone static page from `public/silent-redirect.html`, with the pinned MSAL Browser redirect bridge copied into the build output. It invokes `broadcastResponseToMainFrame()` only when an OAuth response is present, so ordinary visits do not trigger `empty_response` handling. Keep this callback free of `Cross-Origin-Opener-Policy` headers and serve it with `Cache-Control: no-store` in production.

Authentication uses MSAL Angular 5.3.1 and MSAL Browser 5.25.1 with session storage. When React opens Albums, it passes the signed-in account's login hint and Angular attempts `ssoSilent`; no access token is passed between apps. A direct Angular visit without an established Angular session asks the user to sign in through React first. Silent SSO can still fail when the browser blocks Microsoft cookies in a hidden iframe; no password flow or application JWT is used.

Album operations use the same endpoints and query parameters as React:

- `GET /api/albums`, `/api/albums/mine`, or `/api/albums/shared` with `page`, `pageSize`, and optional `search`.
- `POST /api/albums` with `{ "albumName": "..." }`.
- `GET /api/albums/{id}/files?page=1&pageSize=100&category=Images` for the first cover image.
- `GET /api/albums/{id}/files/{fileId}/download` for managers, or `/preview` for shared viewers.
- All protected requests use an Entra access token for `access_as_user` in the `Authorization: Bearer` header.

The Angular page reuses the React app shell styling, logo, navigation, profile menu, page header, album cards, empty state, and pagination. Dashboard and Files navigation still opens the corresponding React route. Album cards and a newly created album open the existing React detail route at `https://localhost:5173/albums/{id}`; the React app stays responsible for that page.

## Run locally

```powershell
cd frontend-angular
npm install
npm start
```

Run the backend at `https://localhost:7106` and React at `https://localhost:5173` for API calls and album detail navigation. Trust the existing ASP.NET Core HTTPS development certificate so the browser can access the backend and React site. The backend development CORS policy allows `http://localhost:4200` explicitly.

The fixed Entra registration only authorizes the localhost redirect URL. A deployed Angular origin needs its own registered redirect URI; this project does not change the registration or invent a production callback. Configure `Cors:AllowedOrigins` with the exact deployed origin if the backend is deployed elsewhere.

## Checks

```powershell
npm run typecheck
npm run build
npm run build:production
```
