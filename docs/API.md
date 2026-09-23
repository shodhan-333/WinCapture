
# WinCapture API

Base path:

`/api`

## Authentication

### POST /api/auth/register

Authentication:

Anonymous

Only `@winwire.com` email addresses are allowed.

Request:

```json
{
  "name": "User",
  "email": "user@winwire.com",
  "password": "Password123!"
}
```

Success:

`201 Created`

Duplicate email:

`409 Conflict`

### POST /api/auth/login

Authentication:

Anonymous

Request:

```json
{
  "email": "user@winwire.com",
  "password": "Password123!"
}
```

Success:

`200 OK`

Invalid credentials:

`401 Unauthorized`

Response:

```json
{
  "token": "jwt-token",
  "userId": 1,
  "name": "User",
  "email": "user@winwire.com",
  "role": "User"
}
```

## Files

### POST /api/files

Authentication:

USER only

Content-Type:

`multipart/form-data`

Field name:

`file`

Maximum file size:

`10 MB`

Supported file types:

- JPG
- JPEG
- PNG
- GIF
- PDF

The API checks both the declared content type and the actual file signature.

Success:

`201 Created`

### GET /api/files

Authentication:

USER / ADMIN

Returns the authenticated user's uploaded files.

Success:

`200 OK`

### GET /api/files/{id}

Authentication:

USER / ADMIN

A normal user can access only their own file.
An Admin can access any file.

Success:

`200 OK`

### PUT /api/files/{id}

Authentication:

USER / ADMIN

A normal user can replace only their own file.
An Admin can replace any file.

Content-Type:

`multipart/form-data`

Success:

`200 OK`

### GET /api/files/{id}/download

Authentication:

USER / ADMIN

A normal user can download only their own file.
An Admin can download any file.

Success:

`200 OK`

### DELETE /api/files/{id}

Authentication:

USER / ADMIN

A normal user can delete only their own file.
An Admin can delete any file.

Success:

`204 No Content`

### GET /api/admin/files

Authentication:

ADMIN

Returns all files.

Success:

`200 OK`

## API Status Codes

| Status Code | Meaning |
|---|---|
| 200 OK | Request completed successfully |
| 201 Created | Resource created successfully |
| 204 No Content | Request succeeded with no response body |
| 400 Bad Request | Request is invalid |
| 401 Unauthorized | Authentication is required or invalid |
| 403 Forbidden | User is authenticated but not permitted |
| 404 Not Found | Requested resource does not exist |
| 409 Conflict | Resource already exists |
| 413 Payload Too Large | Uploaded file exceeds the allowed size |
| 500 Internal Server Error | Unexpected server or storage error |

## API Endpoint Catalog

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Anonymous | Register a WinWire user |
| POST | `/api/auth/login` | Anonymous | Login and obtain JWT |
| POST | `/api/files` | USER | Upload file |
| GET | `/api/files` | USER / ADMIN | Get user's files |
| GET | `/api/files/{id}` | USER / ADMIN | Get file metadata |
| PUT | `/api/files/{id}` | USER / ADMIN | Replace an existing file |
| GET | `/api/files/{id}/download` | USER / ADMIN | Download file |
| DELETE | `/api/files/{id}` | USER / ADMIN | Delete file |
| GET | `/api/admin/files` | ADMIN | Get all files |

## File response URLs

`url` points to the file metadata endpoint.

`downloadUrl` points to the authenticated file download endpoint.