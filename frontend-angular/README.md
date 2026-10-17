# WinCapture Albums in Angular

This is a separate Angular version of the Albums page. It calls the existing ASP.NET Core API and does not change the React app or backend source.

## Before you start

- Install Node.js 20.19+, 22.12+, or 24+ and npm.
- Use the existing Entra SPA client ID, tenant ID, and WinCapture API delegated scope. The client ID and scope are public SPA configuration values; never put a client secret in this project.
- In `src/environments/environment.ts`, copy those three values from the existing React `.env` file into `msalClientId`, `msalTenantId`, and `msalApiScope`. Set `apiBaseUrl` to the running backend URL.
- Add `http://localhost:4200/redirect` as a **Single-page application (SPA)** redirect URI in the same Entra app registration. Keep the React redirect URI registered as well. The app registration and its current values were not available to verify here.
- Also add `http://localhost:4200/silent-redirect.html` as a **Single-page application (SPA)** redirect URI. Angular first tries silent SSO to reuse the Microsoft browser session, without showing a sign-in prompt. This URI serves a blank page for that hidden authentication request.
- Allow `http://localhost:4200` in backend development CORS settings. In PowerShell, start the backend with this environment setting:

  ```powershell
  $env:Cors__AllowedOrigins__0 = 'http://localhost:4200'
  dotnet run --project .\backend\WinCapture.csproj
  ```

  Set the same origin in the backend's normal `Cors:AllowedOrigins` configuration if you use a launch profile or hosting setup that sets CORS elsewhere. This keeps the backend source unchanged.
- The Angular dev server uses HTTP on localhost port 4200. The API uses HTTPS, so trust the ASP.NET development certificate if the browser reports a certificate error: `dotnet dev-certs https --trust`.

## Install and run

From the repository root, open PowerShell and run:

```powershell
cd .\frontend-angular
npm install
npm start
```

Then open `http://localhost:4200`. Use the same npm commands from `frontend-angular` after the first install. To create a production build, run `npm run build`.

## How the pieces fit together

- `src/app/pages/albums/albums.component.ts` owns the page state: current filter, search, page number, loading and error messages, create-album state, and cover URLs. Its HTML template displays that state and sends user actions back to the component.
- `src/app/api/album-api.service.ts` contains the HTTP calls. `HttpClient` turns each request into an observable that the component subscribes to. The service uses the existing `GET /api/albums`, `GET /api/albums/mine`, `GET /api/albums/shared`, `POST /api/albums`, and album-files endpoints.
- `src/app/auth/auth.service.ts` handles the current MSAL account, tries silent Entra SSO when Angular has no local account, and calls the existing `/api/auth/me` endpoint. The route guard protects Albums; explicit sign-in appears only if silent SSO cannot establish a session.
- `src/app/app.routes.ts` maps `/albums` to the page and leaves `/redirect` open for the MSAL redirect bridge. `src/app/app.config.ts` registers routing, `HttpClient`, MSAL, and the MSAL HTTP interceptor.
- The interceptor silently obtains the configured WinCapture API access token and adds `Authorization: Bearer ...` to matching backend requests. If user interaction is required, MSAL starts its redirect flow. The application does not create a separate JWT.
- Tailwind CSS 4 is enabled in `src/styles.css` and `.postcssrc.json`. The page also has a small component stylesheet for the existing glass-card look.

Search waits 300 ms before requesting a new page. The Shared with me tab uses `/api/albums/shared`. For deployments where that endpoint returns 404, it follows the React page's fallback: request accessible album pages and remove albums owned by the current user. Cover previews load the first image from each album and release their temporary browser object URLs when the page changes or closes.

Clicking an album opens the existing React album detail route at `https://localhost:5173/albums/{id}`. Album Detail was intentionally not migrated. MSAL uses session storage scoped to each origin, so Angular cannot read the React cache directly. Silent SSO can reuse the existing Entra browser session when the browser allows it; if third-party cookies are blocked or multiple accounts make the session ambiguous, the fallback sign-in button may be needed.

## Compare and verify manually

1. Start the backend with CORS allowing port 4200 and run the React app and Angular app in separate terminals.
2. Open the React Albums page and Angular Albums page with the same Entra account. Compare the All, My albums, and Shared with me tabs, card details, empty state, and page size (9 cards).
3. Type a search slowly and quickly; confirm results update after the short pause, and that the page returns to page 1 after a filter or search change.
4. Create an album with a name, then confirm the existing React detail page opens. Try an empty name and an API failure to see the error message.
5. Add an image to an album, refresh Angular, and confirm its cover appears. For a shared album, verify that a user with view permission sees the preview.
6. Sign out and sign in again. In browser developer tools, confirm API requests carry a bearer access token and that the API response is successful.

## Current verification status

The repository provides the endpoint contracts and frontend behavior used here. Entra registration values, the tenant's current SPA URI list, the running backend URL, and real account permissions could not be verified from source. Configure those items before treating sign-in as ready. No tests were created or run for this Angular app.
