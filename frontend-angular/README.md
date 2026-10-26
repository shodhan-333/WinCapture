# WinCapture Angular Albums

This Angular app recreates the React Albums page and uses the existing ASP.NET Core API. Its public Entra client ID, tenant, and delegated API scope are configured in `src/environments/environment.ts`; do not add a client secret.

## Shared local origin and sign-in

Run Angular behind the React Vite server at `https://localhost:5173/angular`. Vite proxies `/angular` to Angular on `http://localhost:4200`, while the React pages remain at the root paths such as `/dashboard`, `/files`, and `/albums/{id}`. The browser therefore uses the same origin and session storage for both apps. Angular reads the account already cached by React and obtains API access tokens with `acquireTokenSilent`; it does not start a second sign-in flow. Opening Angular without a React session shows a sign-in-first message.

The Angular MSAL redirect URI is the already registered `https://localhost:5173/redirect.html`. React's Vite server serves `frontend/public/redirect.html` and the pinned MSAL Browser 5.25.1 redirect bridge. The page only starts the bridge when an OAuth response is present, so a normal visit does not process an empty response. No Entra redirect URI change is required.

## Album API operations

- `GET /api/albums`, `/api/albums/mine`, or `/api/albums/shared` with `page`, `pageSize`, and optional `search`.
- `POST /api/albums` with `{ "albumName": "..." }`.
- `GET /api/albums/{id}/files?page=1&pageSize=100&category=Images` for the first cover image.
- `GET /api/albums/{id}/files/{fileId}/download` for managers, or `/preview` for shared viewers.
- Protected requests use a Microsoft access token for `access_as_user` in the `Authorization: Bearer` header.

Album cards, filtering, creation, cover images, empty states, and pagination follow the React page. Selecting an album returns to the existing React detail route. Dashboard and Files navigation also returns to React.

## Run locally

Start the backend at `https://localhost:7106` and trust its ASP.NET Core HTTPS development certificate. Then run these commands in separate terminals:

```powershell
cd frontend-angular
npm install
npm start
```

```powershell
cd frontend
npm install
npm run dev
```

Open `https://localhost:5173`. Sign in through React, then choose Albums. To test the Angular page directly, use `https://localhost:5173/angular/albums`. `ANGULAR_DEV_SERVER_URL` can override the proxy target if Angular runs on a different local address.

The backend's development CORS policy allows the React origin `https://localhost:5173`; Angular API calls use that same browser origin. Production hosting needs equivalent same-origin routing for `/angular` and an already registered callback on that origin. Configure the backend's explicit `Cors:AllowedOrigins` for any different production origin.

## Checks

```powershell
npm run typecheck
npm run build
npm run build:production
npm test
npm run test:coverage
```

Angular tests live in `../Tests/angular.Tests`, organized to match the `src/app` feature and shared-code layout. Coverage output is written to `../Tests/angular.Tests/TestResults`.

After `npm run test:coverage`, open the HTML report from this directory with:

```powershell
Start-Process ..\Tests\angular.Tests\TestResults\index.html
```

## Frontend conventions

This project follows the repository UI standards using Angular equivalents:

- Keep application wiring in `src/app`, shared API and utility code in `shared`, and business UI in `features/<feature>`.
- Use standalone components, typed inputs and outputs, strict TypeScript, and lazy-loaded route components. Keep HTTP requests in `core/api` and show actionable errors in the page.
- Use semantic HTML, labels, keyboard-operable controls, visible focus, and reduced-motion support. Use the global CSS variables as design tokens and Tailwind utilities for component layout and styling.
- Keep public browser configuration in Angular environment files. These values are visible to users; never add secrets or private keys.
- Production builds enforce initial bundle and component-style budgets. Run the type check and production build before merging UI changes.
