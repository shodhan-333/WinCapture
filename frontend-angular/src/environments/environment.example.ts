// Copy these public client settings into environment.ts for another deployment.
// Never place a client secret or API secret in a browser application.
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7106',
  msalClientId: '<SPA_CLIENT_APPLICATION_ID>',
  msalTenantId: '<ENTRA_TENANT_ID>',
  msalApiScope: 'api://<API_APPLICATION_ID>/access_as_user',
  redirectUri: 'https://localhost:5173/redirect.html',
  reactAlbumsUrl: 'https://localhost:5173/albums',
};
