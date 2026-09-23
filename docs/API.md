# WinCapture API

Base path:

`/api`

## Authentication

### POST /api/auth/login

Authentication:

Anonymous

Request:

```json
{
    "email": "user@example.com",
    "password": "password"
}
```

Success:

`200 OK`

Response:

```json
{
    "token": "jwt-token",
    "userId": 1,
    "name": "User",
    "email": "user@example.com",
    "role": "User"
}
```

## Files

### POST /api/files

Authentication:

USER / ADMIN

Content-Type:

`multipart/form-data`

Success:

`201 Created`

### GET /api/files

Authentication:

USER / ADMIN

Success:

`200 OK`

### GET /api/files/{id}

Authentication:

USER / ADMIN

Success:

`200 OK`

### PUT /api/files/{id}

Authentication:

USER / ADMIN

Content-Type:

`multipart/form-data`

Success:

`200 OK`

### GET /api/files/{id}/download
Authentication:
USER / ADMIN

Success:

`200 OK`

### DELETE /api/files/{id}

Authentication:
USER / ADMIN

Success:

`204 No Content`

### GET /api/admin/files

Authentication:
ADMIN

Success:

`200 OK`

## API Status Codes

The API may use:

- `200 OK`
- `201 Created`
- `204 No Content`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `413 Payload Too Large`
- `500 Internal Server Error`

## API Endpoint Catalog

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Anonymous | Login and obtain JWT |
| POST | `/api/files` | USER / ADMIN | Upload file |
| GET | `/api/files` | USER / ADMIN | Get user's files |
| GET | `/api/files/{id}` | USER / ADMIN | Get file representation |
| PUT | `/api/files/{id}` | USER / ADMIN | Replace an existing file |
| GET | `/api/files/{id}/download` | USER / ADMIN | Open/download file |
| DELETE | `/api/files/{id}` | USER / ADMIN | Delete file |
| GET | `/api/admin/files` | ADMIN | Get all files |


## HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 OK | Request completed successfully |
| 201 Created | Resource created successfully |
| 204 No Content | Request succeeded with no response body |
| 400 Bad Request | Request is invalid |
| 401 Unauthorized | Authentication is required or invalid |
| 403 Forbidden | User is authenticated but not permitted |
| 404 Not Found | Requested resource does not exist |
| 413 Payload Too Large | Uploaded file exceeds the allowed size |
| 500 Internal Server Error | Unexpected server error |