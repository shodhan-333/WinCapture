# WinCapture API

This document describes the routes implemented by the ASP.NET Core controllers. The API uses the local SQL Server database for metadata and Azure Blob Storage for file bytes.

## Authentication and authorization

All protected routes require an `Authorization: Bearer <access-token>` header containing a Microsoft Entra ID access token issued for the WinCapture API delegated scope `api://{API client ID}/access_as_user`. The API validates the token and requires that delegated scope. App roles are `WinCapture.User` and `WinCapture.Admin`; the API maps them to the response role strings `User` and `Admin`.

`GET /api/auth/me` requires an authenticated account mapped to a WinCapture user and one of those app roles. Regular users can access their own files and albums shared with them according to album permissions. Admin-only listing routes are protected by the `WinCapture.Admin` role. Album and file management methods also check ownership, membership permissions, and role in their services.

There are no register or password-login endpoints in the current implementation. Sign-in and account provisioning are handled through Microsoft Entra ID; the frontend does not send passwords to this API.

## Common query parameters and response formats

Paged list routes accept:

| Parameter | Default | Constraints / meaning |
|---|---:|---|
| `page` | `1` | Must be at least 1 |
| `pageSize` | `10` | 1 through 100 |
| `search` | omitted | Optional search text, applied by the relevant service |
| `category` | omitted | File lists accept `All`, `Images`, `Documents`, `Videos`, `Audio`, or `Archives`; not an album-name filter |

Paged responses use `{ "items": [], "totalItems": 0, "page": 1, "pageSize": 10, "pageCount": 0 }`. File category filtering is based on the stored file name/type classification in the service. `All` means no category filter.

JSON request and response property names use camel case. Error middleware returns `{ "status": 400, "message": "..." }` (with the actual status) for handled service/API exceptions. ASP.NET model-binding and attribute-validation failures use the framework's validation response, and authentication middleware may return its standard 401/403 response. Common statuses are 400 validation/query errors, 401 missing or invalid authentication, 403 authenticated but unauthorized, 404 missing/inaccessible resource, 409 conflict, 413 upload too large, and 500 unexpected server/storage failure.

## Authentication

| Method and route | Authorization | Response / behavior |
|---|---|---|
| `GET /api/auth/me` | Bearer token; authenticated mapped WinCapture user with `WinCapture.User` or `WinCapture.Admin` role | `200 CurrentUserResponse`: `{ userId, name, email, role, authenticationType }`; `401` invalid/missing mapped user; `403` missing WinCapture role |

## Albums

All routes require a bearer token. The ordinary album routes permit the `WinCapture.User` and `WinCapture.Admin` roles, with ownership and album permission checks performed by the services.

| Method and route | Parameters / body | Response / behavior |
|---|---|---|
| `POST /api/albums` | JSON `{ "albumName": "..." }` | `201 AlbumResponse`, `Location: /api/albums/{id}`; creates for current user |
| `GET /api/albums` | Common pagination/search parameters | `200 PagedResponse<AlbumResponse>` for albums the current user can access |
| `GET /api/albums/mine` | Common pagination/search parameters | `200 PagedResponse<AlbumResponse>` owned by current user |
| `GET /api/albums/shared` | Common pagination/search parameters | `200 PagedResponse<AlbumResponse>` shared with current user |
| `GET /api/albums/{id}` | Route `id` (Int64) | `200 AlbumResponse` if accessible |
| `PUT /api/albums/{id}` | JSON `{ "albumName": "..." }` | `200 AlbumResponse`; update permission checked by service |
| `DELETE /api/albums/{id}` | Route `id` | `204 No Content`; delete permission checked by service |
| `POST /api/albums/{id}/files` | Multipart form field `file` | `201 FileResponse`; adds an uploaded file to the album |
| `PUT /api/albums/{id}/files/{fileId}` | Route IDs; multipart form field `file` | `200 FileResponse`; replaces the file |
| `GET /api/albums/{id}/files` | Common pagination and category parameters | `200 PagedResponse<FileResponse>` subject to album access |
| `GET /api/albums/{id}/files/{fileId}` | Route IDs | `200 FileResponse` if accessible |
| `GET /api/albums/{id}/files/{fileId}/preview` | Route IDs | `200` file bytes with content type, inline preview access rules |
| `GET /api/albums/{id}/files/{fileId}/download` | Route IDs | `200` file bytes with download filename |
| `DELETE /api/albums/{id}/files/{fileId}` | Route IDs | `200 { "storageCleanupComplete": boolean }`; deletes the file through the existing album-file workflow |
| `DELETE /api/albums/{id}/files/{fileId}/association` | Route IDs | `204 No Content`; removes only the file-to-album association where permitted |
| `GET /api/albums/{id}/members` | Route `id` | `200 AlbumMemberResponse[]`; member visibility checked by service |
| `POST /api/albums/{id}/members` | JSON `{ "email": "...", "canView": true, "canDownload": true }` | `204 No Content`; grants album access |
| `PUT /api/albums/{id}/members/{userId}` | JSON `{ "canView": true, "canDownload": true }` | `204 No Content`; changes that member's permissions |
| `DELETE /api/albums/{id}/members/{userId}` | Route IDs | `204 No Content`; removes album access |

`AlbumResponse` contains `id`, `albumName`, `ownerId`, `ownerName`, `createdAt`, and nullable `updatedAt`. `AlbumMemberResponse` contains `userId`, `name`, `email`, `canView`, `canDownload`, and `grantedAt`.

## Files

All routes require a bearer token and the user/admin app role where explicitly listed. Standard file list and personal operations are scoped to the authenticated user. The services enforce access to files and album relationships.

| Method and route | Parameters / body | Response / behavior |
|---|---|---|
| `POST /api/files` | Multipart form field `file` | `201 FileResponse`, `Location: /api/files/{id}`; uploads for current user |
| `GET /api/files` | Common pagination, search, and category parameters | `200 PagedResponse<FileResponse>` for current user's files |
| `GET /api/files/favorites` | Common pagination, search, and category parameters | `200 PagedResponse<FileResponse>` for current user's favorites, restricted to accessible/manageable files by role and membership |
| `PUT /api/files/{id}/favorite` | Route `id` | `204 No Content`; adds an accessible file to favorites |
| `DELETE /api/files/{id}/favorite` | Route `id` | `204 No Content`; removes current user's favorite entry |
| `GET /api/files/{id}` | Route `id` | `200 FileResponse` if current user may access it |
| `PUT /api/files/{id}` | Route `id`; multipart form field `file` | `200 FileResponse`; replaces a file subject to ownership/role checks |
| `GET /api/files/{id}/download` | Route `id` | `200` file bytes with download filename |
| `DELETE /api/files/{id}` | Route `id` | `200 { "storageCleanupComplete": boolean }`; deletes subject to ownership/role checks |

`FileResponse` contains `id`, `originalFileName`, `contentType`, `fileSize`, `uploadedAt`, `url`, `downloadUrl`, `isFavorite`, and `canManage`. Downloads and previews return binary content rather than JSON. `AdminFileResponse` contains `id`, `originalFileName`, `contentType`, `fileSize`, `uploadedAt`, `uploadedBy`, `uploaderName`, nullable `albumId`, and nullable `albumName`.

Uploads are limited to 10 MiB per file. The API validates extension, declared MIME type, and file structure/signature. The implemented extension/MIME pairs are:

| Category | Supported extensions |
|---|---|
| Images | `.jpg` (`image/jpeg`), `.jpeg` (`image/jpeg`), `.png` (`image/png`), `.webp` (`image/webp`) |
| Documents | `.pdf` (`application/pdf`), `.txt` (`text/plain`), `.csv` (`text/csv`), `.docx` (Open XML Word MIME), `.xlsx` (Open XML Excel MIME), `.pptx` (Open XML PowerPoint MIME) |
| Videos | `.mp4` (`video/mp4`), `.mov` (`video/quicktime`), `.webm` (`video/webm`) |
| Audio | `.mp3` (`audio/mpeg`), `.wav` (`audio/wav`), `.m4a` (`audio/mp4`) |
| Archives | `.zip` (`application/zip`) |

Album and file upload routes accept multipart form data and allow approximately 1 MiB of request framing overhead beyond the 10 MiB file limit. Unsupported type, empty/invalid file, and malformed file content return 400; an oversized file returns 413.

## Administrator listing routes

These routes are protected at controller level by `[Authorize(Roles = "WinCapture.Admin")]`.

| Method and route | Parameters | Response / behavior |
|---|---|---|
| `GET /api/admin/files` | Common pagination/search/category parameters | `200 PagedResponse<AdminFileResponse>` for all users' files |
| `GET /api/admin/albums` | Common pagination/search parameters | `200 PagedResponse<AlbumResponse>` for all users' albums |
| `GET /api/admin/albums/mine` | Common pagination/search parameters | `200 PagedResponse<AlbumResponse>` owned by current admin |
| `GET /api/admin/files/mine` | Common pagination/search/category parameters | `200 PagedResponse<AdminFileResponse>` uploaded by current admin |

These are listing endpoints only; content mutations use the album and file routes above, which apply the corresponding service-level access checks.

## CORS configuration

The backend reads explicit trusted origins from `Cors:AllowedOrigins` (array of origin strings). An origin must contain only an HTTP or HTTPS scheme and authority; paths, wildcard origins, query strings, and fragments are rejected. Development additionally allows `https://localhost:5173`. Production must configure at least one trusted origin; otherwise startup fails. Configure the actual deployed frontend origin through environment-specific configuration, for example `Cors__AllowedOrigins__0=https://<your-trusted-frontend-host>` (replace with the deployment's approved origin). Do not use `*`, especially when credentials are involved.
