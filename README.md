# WinCapture

WinCapture is a secure file and photo management web application built with a React frontend and an ASP.NET Core Web API backend.

The application provides Microsoft Entra ID authentication, role-based authorization, file management, album management, SQL Server persistence, Azure Blob Storage, OpenAPI documentation, and automated testing.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [Authorization and Roles](#authorization-and-roles)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Microsoft Entra ID Configuration](#microsoft-entra-id-configuration)
- [Microsoft Entra API App Registration](#microsoft-entra-api-app-registration)
- [Microsoft Entra Frontend App Registration](#microsoft-entra-frontend-app-registration)
- [Microsoft Entra Groups](#microsoft-entra-groups)
- [Redirect URIs](#redirect-uris)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Database](#database)
- [Azure Blob Storage](#azure-blob-storage)
- [CORS](#cors)
- [HTTPS](#https)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Authentication Flow](#authentication-flow)
- [Access Token Validation](#access-token-validation)
- [User Provisioning and Role Mapping](#user-provisioning-and-role-mapping)
- [API Authorization](#api-authorization)
- [Authentication API](#authentication-api)
- [Album Management](#album-management)
- [File Management](#file-management)
- [File Validation](#file-validation)
- [Storage Flow](#storage-flow)
- [Swagger / OpenAPI](#swagger--openapi)
- [Frontend MSAL](#frontend-msal)
- [Security](#security)
- [Exception Handling](#exception-handling)
- [Environment Variables](#environment-variables)
- [Git](#git)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)
- [Development Checklist](#development-checklist)
- [Quick Start](#quick-start)

---

# Overview

WinCapture allows authenticated users to securely manage files and albums.

The current authentication architecture is Microsoft Entra ID only.

The main application flow is:

```text
React Frontend
      |
      | MSAL
      v
Microsoft Entra ID
      |
      | Microsoft Access Token
      v
WinCapture ASP.NET Core API
      |
      +-- Token validation
      +-- Tenant validation
      +-- Audience validation
      +-- Scope validation
      +-- Company-domain validation
      +-- Role mapping
      |
      v
WinCapture User
      |
      +-----------------------+
      |                       |
      v                       v
    User                    Admin
      |                       |
      +-----------+-----------+
                  |
                  v
        WinCapture Services
             /       \
            v         v
       SQL Server   Azure Blob Storage
```

WinCapture does not issue a second application JWT after Microsoft authentication.

---

# Key Features

## Authentication

- Microsoft Entra ID authentication
- Microsoft access tokens used directly by the API
- Tenant validation
- Audience validation
- Scope validation
- Token expiration validation
- Signing-key validation
- WinWire account-domain validation

## Authorization

- User role
- Admin role
- Role-based endpoint authorization
- File ownership checks
- Album access checks
- Download permission checks
- Administrative endpoint protection

## Files

- File upload
- File listing
- File retrieval
- File download
- File replacement
- File deletion
- File metadata management
- Azure Blob Storage integration

## Albums

- Album creation
- Album listing
- Album retrieval
- Album updates
- Album deletion
- Album sharing
- View permissions
- Download permissions

# Architecture

## High-Level Architecture

```text
+--------------------------+
|      React Frontend      |
|     React + Vite + TS    |
|          MSAL            |
+------------+-------------+
             |
             | Microsoft authentication
             |
             v
+--------------------------+
|    Microsoft Entra ID    |
+------------+-------------+
             |
             | Microsoft API access token
             |
             v
+--------------------------+
|     WinCapture API       |
|      ASP.NET Core        |
|         .NET 10          |
+------------+-------------+
             |
       +-----+-----+
       |           |
       v           v
+-------------+ +------------------+
| SQL Server  | | Azure Blob       |
| Metadata    | | File Content     |
+-------------+ +------------------+
```

---

# Technology Stack

## Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- Microsoft Entra ID
- ASP.NET Core JWT Bearer middleware for Microsoft-issued access tokens
- Azure Identity
- Azure Storage Blobs
- OpenAPI
- Swagger UI

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- `@azure/msal-browser`
- `@azure/msal-react`

# Project Structure

```text
WinCapture/
|
+-- backend/
|   +-- Controllers/
|   +-- Data/
|   +-- DTOs/
|   +-- Exceptions/
|   +-- Middleware/
|   +-- Models/
|   +-- Repositories/
|   +-- Services/
|   +-- Validators/
|   +-- Program.cs
|   +-- appsettings.json
|   +-- appsettings.Development.json
|   +-- WinCapture.csproj
|
+-- frontend/
|   +-- public/
|   |   +-- redirect.html
|   +-- src/
|       +-- api/
|       +-- components/
|       +-- context/
|       +-- App.tsx
|       +-- Login.tsx
|       +-- authConfig.ts
|       +-- main.tsx
|       +-- index.css
|   +-- .env.example
|   +-- package.json
|   +-- tsconfig.json
|   +-- vite.config.ts
|
|
+-- .gitignore
+-- README.md
```

---

# Authentication

## Microsoft Entra ID Only

WinCapture uses Microsoft Entra ID as the authentication provider.

The API expects a Microsoft Entra access token:

```http
Authorization: Bearer <MICROSOFT_ACCESS_TOKEN>
```

The frontend obtains the token using MSAL.

The backend validates the Microsoft-issued access token.

The application does not depend on an application-generated JWT for normal authentication.

---

# Authentication Flow

```text
1. User opens WinCapture
         |
         v
2. React initializes MSAL
         |
         v
3. User signs in with Microsoft
         |
         v
4. Microsoft Entra authenticates the user
         |
         v
5. MSAL acquires WinCapture API access token
         |
         v
6. React sends access token to the API
         |
         v
7. Backend validates token
         |
         v
8. Backend validates tenant
         |
         v
9. Backend validates audience
         |
         v
10. Backend validates scope
         |
         v
11. Backend validates company domain
         |
         v
12. Backend maps Microsoft group to WinCapture role
         |
         v
13. Backend creates or updates WinCapture user
         |
         v
14. API authorization is evaluated
         |
         v
15. Controller executes
```

---

# Authorization and Roles

WinCapture supports:

```text
User
Admin
```

Authorization is performed by the backend.

The frontend may hide or show UI elements based on role, but backend authorization remains authoritative.

Examples of role-based authorization:

```csharp
[Authorize]
```

```csharp
[Authorize(Roles = "User")]
```

```csharp
[Authorize(Roles = "Admin")]
```

---

# Microsoft Entra ID Configuration

Microsoft Entra configuration is required for both the API and frontend.

The API requires:

- Tenant ID
- API Client ID
- API delegated scope
- User group object ID
- Admin group object ID

The frontend requires:

- Frontend client ID
- Tenant ID
- API scope
- Redirect URI

---

# Microsoft Entra API App Registration

Create or use the WinCapture API app registration.

Configure:

```text
Microsoft Entra ID
    |
    +-- App registrations
           |
           +-- WinCapture API
```

The API Client ID is configured as:

```text
AzureAd:ApiClientId
```

It must be a valid GUID.

---

# API Scope

The API must expose a delegated permission:

```text
access_as_user
```

The frontend requests the complete scope:

```text
api://<API_CLIENT_ID>/access_as_user
```

Example:

```text
api://11111111-2222-3333-4444-555555555555/access_as_user
```

Use the actual API Client ID for the environment.

The backend configuration uses:

```text
AzureAd:Scope = access_as_user
```

---

# Microsoft Entra Frontend App Registration

The React application uses MSAL and should use SPA configuration.

Configure the frontend application as a Single Page Application.

Development redirect:

```text
https://localhost:5173/
```

If used by the application, also register:

```text
https://localhost:5173/redirect.html
```

Do not place a client secret in the frontend.

---

# Microsoft Entra Groups

The backend maps Entra groups to WinCapture roles.

Example group structure:

```text
SG-WinCapture-Users
SG-WinCapture-Admins
```

Configure the actual group object IDs as:

```text
AzureAd:Groups:User
AzureAd:Groups:Admin
```

The values must be valid GUIDs.

They must be different.

Group object IDs should remain backend configuration.

They should not be placed in the React application.

---

# Redirect URIs

## Frontend

```text
https://localhost:5173/
```

If applicable:

```text
https://localhost:5173/redirect.html
```

## Swagger

If Swagger OAuth is enabled:

```text
https://localhost:7106/swagger/oauth2-redirect.html
```

The redirect URI configured in Microsoft Entra must match the URI used by the application exactly.

---

# Backend Configuration

The backend expects the following settings:

```text
ConnectionStrings:WinCaptureDatabase

AzureAd:Instance
AzureAd:TenantId
AzureAd:ApiClientId
AzureAd:Scope
AzureAd:Groups:User
AzureAd:Groups:Admin

WinCapture:CompanyDomain

Cors:AllowedOrigins

Storage:AccountName
Storage:ContainerName
```

---

# Example Backend Configuration

Example `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "WinCaptureDatabase": "Server=(localdb)\MSSQLLocalDB;Database=WinCapture;Trusted_Connection=True;TrustServerCertificate=True"
  },

  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "<TENANT_ID>",
    "ApiClientId": "<API_CLIENT_ID>",
    "Scope": "access_as_user",
    "Groups": {
      "User": "<USER_GROUP_OBJECT_ID>",
      "Admin": "<ADMIN_GROUP_OBJECT_ID>"
    }
  },

  "WinCapture": {
    "CompanyDomain": "winwire.com"
  },

  "Cors": {
    "AllowedOrigins": [
      "https://localhost:5173"
    ]
  },

  "Storage": {
    "AccountName": "<STORAGE_ACCOUNT_NAME>",
    "ContainerName": "<STORAGE_CONTAINER_NAME>"
  }
}
```

Do not commit real production credentials or secrets.

---

# Backend Configuration Validation

The backend validates required settings during application startup.

Possible errors include:

```text
AzureAd:Instance is missing.
AzureAd:TenantId is missing.
AzureAd:ApiClientId is missing or invalid.
AzureAd:Scope is missing.
AzureAd:Groups:User is missing or invalid.
AzureAd:Groups:Admin is missing or invalid.
AzureAd user and admin group IDs must be different.
WinCapture:CompanyDomain is missing.
Storage:AccountName is missing.
Storage:ContainerName is missing.
WinCaptureDatabase connection string is missing.
```

This ensures that the application does not run with incomplete security or storage configuration.

---

# Frontend Configuration

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_BASE_URL=https://localhost:7106
VITE_MSAL_CLIENT_ID=<FRONTEND_CLIENT_ID>
VITE_MSAL_TENANT_ID=<TENANT_ID>
VITE_MSAL_REDIRECT_URI=https://localhost:5173/
VITE_MSAL_API_SCOPE=api://<API_CLIENT_ID>/access_as_user
```

---

# Frontend .env.example

Use placeholder values in `.env.example`:

```env
VITE_API_BASE_URL=https://localhost:7106
VITE_MSAL_CLIENT_ID=<FRONTEND_CLIENT_ID>
VITE_MSAL_TENANT_ID=<TENANT_ID>
VITE_MSAL_REDIRECT_URI=https://localhost:5173/
VITE_MSAL_API_SCOPE=api://<API_CLIENT_ID>/access_as_user
```

Never place these in frontend configuration:

```text
Client secret
Database password
Azure Storage account key
Private key
JWT signing secret
```

Anything prefixed with `VITE_` is exposed to the browser.

---

# Database

WinCapture uses SQL Server for application data.

The database stores metadata such as:

- Users
- Roles
- Albums
- Album access
- File metadata
- File ownership
- Upload information

The physical file content is stored in Azure Blob Storage.

---

# Database Connection

Required key:

```text
ConnectionStrings:WinCaptureDatabase
```

Example LocalDB connection:

```text
Server=(localdb)\MSSQLLocalDB;
Database=WinCapture;
Trusted_Connection=True;
TrustServerCertificate=True
```

Make sure the SQL Server/LocalDB instance is available.

---

# Azure Blob Storage

Azure Blob Storage stores uploaded file content.

Required:

```text
Storage:AccountName
Storage:ContainerName
```

Example:

```json
{
  "Storage": {
    "AccountName": "wincapturestorage",
    "ContainerName": "files"
  }
}
```

The backend uses Azure Identity / `DefaultAzureCredential`.

Storage secrets should not be hard-coded.

---

# Azure Blob Storage Permissions

The development or production Azure identity must have the required permissions for the configured storage account/container.

The exact Azure role assignment depends on the deployment model.

---

# CORS

The development frontend is:

```text
https://localhost:5173
```

Configure:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://localhost:5173"
    ]
  }
}
```

The backend uses the configured origins for CORS.

Only trusted frontend origins should be configured.

---

# HTTPS

Development endpoints:

```text
Frontend:
https://localhost:5173

Backend:
https://localhost:7106
```

Trust the ASP.NET Core development certificate:

```powershell
dotnet dev-certs https --trust
```

---

# Running the Backend

From the solution root:

```powershell
dotnet restore .ackend\WinCapture.csproj
```

Build:

```powershell
dotnet build .ackend\WinCapture.csproj
```

Run:

```powershell
dotnet run --project .ackend\WinCapture.csproj
```

Backend:

```text
https://localhost:7106
```

---

# Running the Frontend

Open another terminal:

```powershell
cd frontend
```

Install packages:

```powershell
npm install
```

Run:

```powershell
npm run dev
```

Frontend:

```text
https://localhost:5173
```

---

# Development URLs

| Component | URL |
|---|---|
| Frontend | `https://localhost:5173` |
| Backend | `https://localhost:7106` |
| OpenAPI | `https://localhost:7106/openapi/v1.json` |
| Swagger | `https://localhost:7106/swagger` |

---

# Access Token Validation

The backend validates Microsoft Entra access tokens directly.

Validation includes:

## Issuer

The token must be issued by the configured Microsoft Entra tenant.

## Tenant

The `tid` claim must match:

```text
AzureAd:TenantId
```

## Audience

The token must target the WinCapture API.

## Lifetime

Expired tokens are rejected.

## Signature

The token signature must be valid.

## Algorithm

The backend validates supported Microsoft token signing algorithms.

## Scope

The required API scope must be present:

```text
access_as_user
```

## Email Domain

Only accounts belonging to the configured WinWire domain are allowed.

---

# User Provisioning and Role Mapping

After token validation, the backend maps Microsoft identity data to a WinCapture user.

The mapped user information can include:

```text
Name
Email
Role
WinCapture User ID
Authentication Type
```

The authentication type is:

```text
Microsoft Entra ID
```

The Microsoft user service creates or updates the WinCapture user record as required by the application.

---

# User Role

A User has normal application access according to the endpoint and resource-level permissions.

Typical access includes:

- File upload
- File listing
- File retrieval
- File download
- File replacement
- File deletion
- Album management
- Shared album access where permission has been granted

---

# Admin Role

An Admin can access endpoints protected by the Admin role.

Examples include:

```text
GET /api/admin/files
GET /api/admin/albums
```

Admin access is enforced on the backend.

---

# API Authorization

Protected endpoints use ASP.NET Core authorization.

Examples:

```csharp
[Authorize]
```

```csharp
[Authorize(Roles = "User")]
```

```csharp
[Authorize(Roles = "Admin")]
```

The backend is the final authority for authorization.

---

# Authentication API

## Current User

```http
GET /api/auth/me
```

This endpoint returns the currently authenticated WinCapture user.

Typical response information includes:

```text
User ID
Name
Email
Role
Authentication Provider
```

The authentication provider is:

```text
Microsoft Entra ID
```

---

# File Management

Typical file operations include:

```text
POST   /api/files
GET    /api/files
GET    /api/files/{id}
PUT    /api/files/{id}
DELETE /api/files/{id}
```

Administrative file operations are under:

```text
/api/admin/files
```

The OpenAPI document is the authoritative source for the currently exposed endpoint list.

---

# File Upload

Uploads use multipart form data.

Example:

```http
POST /api/files
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: multipart/form-data
```

The flow is:

```text
Frontend
   |
   v
FilesController
   |
   v
FileService
   |
   +-- FileValidator
   |
   +-- Azure Blob Storage
   |
   +-- SQL Server metadata
   |
   v
Response
```

---

# File Validation

The current supported file types are:

| Extension | Content Type |
|---|---|
| `.jpg` | `image/jpeg` |
| `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.pdf` | `application/pdf` |

Unsupported file types should be rejected by the validator.

---

# File Metadata

File metadata can include:

```text
OriginalFileName
StoredFileName
ContentType
FileSize
UploadedBy
UploadedAt
```

The original filename is treated as metadata.

The stored filename is used for physical Blob Storage.

---

# File Ownership

File access is validated by the backend.

A user must not be able to access another user's protected file merely by changing the file ID in the request.

Administrative access is controlled by the Admin role.

---

# Album Management

Typical album operations include:

```text
POST   /api/albums
GET    /api/albums
GET    /api/albums/{id}
PUT    /api/albums/{id}
DELETE /api/albums/{id}
```

Administrative album operations may be exposed under:

```text
/api/admin/albums
```

Always use the current OpenAPI document for the exact endpoint list.

---

# Album Access

Albums may be shared with other users.

Access permissions can include:

```text
CanView
CanDownload
```

The backend determines whether a user can:

- View an album
- Download files
- Access album files
- Modify an album
- Modify access
- Perform owner-only operations

---

# IDOR Protection

The API must protect against insecure direct object reference attacks.

Examples:

```text
User A accessing User B's file
User A accessing User B's private album
User A changing an album ID
User A changing a file ID
User A changing a user ID
```

The backend evaluates the authenticated user against the resource relationship:

```text
Authenticated User
       |
       +-- Owner?
       |
       +-- Shared access?
       |
       +-- Download allowed?
       |
       +-- Admin?
```

The test suite includes authorization and IDOR-oriented tests.

---

# Storage Flow

## Upload

```text
React
  |
  | multipart/form-data
  v
FilesController
  |
  v
FileService
  |
  +---- FileValidator
  |
  +---- AzureBlobStorageService
  |           |
  |           v
  |      Azure Blob Storage
  |
  +---- FileRepository
              |
              v
          SQL Server
```

SQL Server stores the metadata.

Azure Blob Storage stores the physical file.

---

# Swagger / OpenAPI

OpenAPI:

```text
https://localhost:7106/openapi/v1.json
```

Swagger:

```text
https://localhost:7106/swagger
```

Swagger documents bearer authentication for protected endpoints.

---

# Swagger OAuth

When OAuth login is enabled for Swagger, use:

```text
Authorization Code Flow + PKCE
```

Requested API scope:

```text
api://<API_CLIENT_ID>/access_as_user
```

Swagger redirect URI:

```text
https://localhost:7106/swagger/oauth2-redirect.html
```

Do not expose a client secret in browser configuration.

---

# Frontend MSAL

The React frontend uses MSAL for Microsoft authentication.

The frontend:

1. Initializes MSAL.
2. Checks the current account/authentication state.
3. Starts Microsoft sign-in when required.
4. Requests the WinCapture API scope.
5. Obtains an access token.
6. Sends the access token to the backend.
7. Calls `/api/auth/me`.
8. Displays the authenticated application state.
9. Uses MSAL logout.

---

# Logout

Logout is handled through MSAL.

The frontend should:

1. Sign the user out through Microsoft authentication.
2. Clear current application authentication state.
3. Clear current user information.
4. Return the user to the login page.

Custom application JWT logout logic is not required.

---

# Test Project Configuration

The test project targets:

```text
net10.0
```

The project uses Microsoft Testing Platform.

Relevant project configuration:

```xml
<TargetFramework>net10.0</TargetFramework>
<OutputType>Exe</OutputType>
<IsTestProject>true</IsTestProject>
<UseMicrosoftTestingPlatformRunner>true</UseMicrosoftTestingPlatformRunner>
```

---

# Test Dependencies

Important packages include:

```text
Microsoft.AspNetCore.Mvc.Testing
Microsoft.EntityFrameworkCore.Sqlite
xunit.v3
Moq
FluentAssertions
Azure.Storage.Blobs
```

---

# Run Specific Tests

Authentication:

```powershell
dotnet test .	ests\WinCapture.Tests.csproj --filter "FullyQualifiedName~AuthApiTests"
```

Files:

```powershell
dotnet test .	ests\WinCapture.Tests.csproj --filter "FullyQualifiedName~FileApiTests"
```

Albums:

```powershell
dotnet test .	ests\WinCapture.Tests.csproj --filter "FullyQualifiedName~AlbumApiTests"
```

Security:

```powershell
dotnet test .	ests\WinCapture.Tests.csproj --filter "FullyQualifiedName~AuthorizationSecurityApiTests"
```

---

# Security

Security decisions are enforced on the backend.

## Authentication Security

The backend validates:

- Issuer
- Tenant
- Audience
- Lifetime
- Signing key
- Scope
- Company domain

## Authorization Security

The backend validates:

- Role
- File ownership
- Album ownership
- Album access
- Download permission
- Administrative access

---

# Frontend Security

The frontend should never:

- Generate authentication tokens
- Generate application JWTs
- Store client secrets
- Treat UI role checks as authorization
- Send an ID token when an API access token is required

---

# Backend Security

The backend is responsible for:

- Microsoft token validation
- Tenant validation
- Scope validation
- Audience validation
- Company-domain validation
- Role mapping
- User provisioning
- Endpoint authorization
- File access authorization
- Album access authorization
- Admin authorization

---

# Exception Handling

WinCapture uses centralized exception middleware.

Application exception types can include:

```text
BadRequestException
ConflictException
UnauthorizedException
ForbiddenException
NotFoundException
PayloadTooLargeException
StorageException
```

Typical response mapping:

| Exception | HTTP Status |
|---|---:|
| BadRequestException | 400 |
| UnauthorizedException | 401 |
| ForbiddenException | 403 |
| NotFoundException | 404 |
| ConflictException | 409 |
| PayloadTooLargeException | 413 |
| StorageException | 500 |

Unexpected exceptions should not expose sensitive internal details.

---

# HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Successful operation |
| 201 | Resource created |
| 204 | Successful operation with no response body |
| 400 | Invalid request |
| 401 | Authentication missing or invalid |
| 403 | Authenticated but unauthorized |
| 404 | Resource not found |
| 409 | Resource conflict |
| 413 | Request/file too large |
| 500 | Unexpected server error |

---

# Environment Variables

## Frontend

```env
VITE_API_BASE_URL=https://localhost:7106
VITE_MSAL_CLIENT_ID=<FRONTEND_CLIENT_ID>
VITE_MSAL_TENANT_ID=<TENANT_ID>
VITE_MSAL_REDIRECT_URI=https://localhost:5173/
VITE_MSAL_API_SCOPE=api://<API_CLIENT_ID>/access_as_user
```

## Backend

ASP.NET Core configuration includes:

```text
ConnectionStrings:WinCaptureDatabase

AzureAd:Instance
AzureAd:TenantId
AzureAd:ApiClientId
AzureAd:Scope
AzureAd:Groups:User
AzureAd:Groups:Admin

WinCapture:CompanyDomain

Cors:AllowedOrigins

Storage:AccountName
Storage:ContainerName
```

---

# Secrets

Never commit:

```text
Client secrets
Database passwords
Storage access keys
Storage connection strings containing secrets
Private keys
JWT signing secrets
Access tokens
Refresh tokens
```

Use secure environment-specific configuration and a secret-management solution for production.

---

# Git

Stage all files:

```powershell
git add .
```

Check status:

```powershell
git status
```

See staged files:

```powershell
git diff --cached --name-only
```

Unstage everything without deleting changes:

```powershell
git restore --staged .
```

Unstage one file:

```powershell
git restore --staged path	oile
```

Commit:

```powershell
git commit -m "Update WinCapture"
```

---

# Line Endings

Windows commonly uses:

```text
CRLF
```

Linux/macOS commonly use:

```text
LF
```

Git may display:

```text
LF will be replaced by CRLF
```

This is a line-ending conversion warning.

It does not mean `git add .` failed.

Check the current setting:

```powershell
git config --get core.autocrlf
```

---

# .gitignore

The repository should normally ignore:

```text
bin/
obj/
.vs/
node_modules/
dist/
.env
.env.*
*.user
*.suo
```

Keep `.env.example` because it contains placeholders rather than secrets.

---

# Troubleshooting

## AzureAd:TenantId is missing

Make sure the backend contains:

```json
{
  "AzureAd": {
    "TenantId": "<TENANT_ID>"
  }
}
```

Verify the correct configuration file/environment is being loaded.

---

## AzureAd:ApiClientId is missing or invalid

Verify:

```text
AzureAd:ApiClientId
```

contains the WinCapture API application's client ID and is a valid GUID.

---

## AzureAd:Scope is missing

Configure:

```text
AzureAd:Scope
```

Example:

```text
access_as_user
```

The frontend scope remains:

```text
api://<API_CLIENT_ID>/access_as_user
```

---

## Azure AD Group Configuration Error

Verify:

```text
AzureAd:Groups:User
AzureAd:Groups:Admin
```

are valid Microsoft Entra group object IDs and are different values.

---

## 401 Unauthorized

Check:

1. The request contains an Authorization header.
2. The header uses `Bearer`.
3. The token is a Microsoft Entra API access token.
4. The audience is the WinCapture API.
5. The token is not expired.
6. The tenant is correct.
7. The `access_as_user` scope is present.
8. The account is allowed by the configured company domain.

Correct header:

```http
Authorization: Bearer <MICROSOFT_ACCESS_TOKEN>
```

Do not use the ID token as the API access token.

---

## 403 Forbidden

Authentication succeeded, but authorization failed.

Check:

```text
Role
Microsoft Entra group membership
Endpoint role requirements
File ownership
Album permissions
Download permission
```

---

## Swagger 401

Verify Swagger requests:

```text
api://<API_CLIENT_ID>/access_as_user
```

The token must be intended for the WinCapture API.

---

## AADSTS50011

If Microsoft reports:

```text
AADSTS50011
```

verify the redirect URIs:

```text
https://localhost:5173/
https://localhost:5173/redirect.html
https://localhost:7106/swagger/oauth2-redirect.html
```

Only register the URIs that are actually used by the corresponding application.

The URI must match exactly.

---

## Database Connection Failure

Verify:

```text
ConnectionStrings:WinCaptureDatabase
```

Example:

```text
Server=(localdb)\MSSQLLocalDB;
Database=WinCapture;
Trusted_Connection=True;
TrustServerCertificate=True
```

Make sure SQL Server/LocalDB is available.

---

## Azure Blob Storage Failure

Verify:

```text
Storage:AccountName
Storage:ContainerName
```

Also verify that the Azure identity used by the application has the required permissions.

---

## CORS Failure

Make sure:

```text
https://localhost:5173
```

is listed in:

```text
Cors:AllowedOrigins
```

---

## HTTPS Certificate Failure

Run:

```powershell
dotnet dev-certs https --trust
```

Restart the browser and development servers.

---

## Test Host Says AzureAd:TenantId Is Missing

The integration-test host must provide startup settings required by the production `Program.cs`.

The test factory should supply values for:

```text
AzureAd:Instance
AzureAd:TenantId
AzureAd:ApiClientId
AzureAd:Scope
AzureAd:Groups:User
AzureAd:Groups:Admin
WinCapture:CompanyDomain
Storage:AccountName
Storage:ContainerName
ConnectionStrings:WinCaptureDatabase
```

The test authentication handler can then simulate an authenticated identity for the automated test suite.

---

# Production Checklist

## Microsoft Entra

- [ ] Tenant ID configured correctly
- [ ] API Client ID configured correctly
- [ ] `access_as_user` delegated scope exists
- [ ] Frontend redirect URI registered
- [ ] Swagger redirect URI registered if required
- [ ] User group configured
- [ ] Admin group configured
- [ ] User and Admin group IDs are different
- [ ] Group assignments verified
- [ ] API permissions verified

## Backend

- [ ] Production SQL Server configured
- [ ] Production Blob Storage configured
- [ ] Production Azure identity configured
- [ ] Production CORS configured
- [ ] HTTPS configured
- [ ] Secrets stored securely
- [ ] Development configuration not used in production
- [ ] Logging reviewed
- [ ] Exception handling reviewed

## Frontend

- [ ] Production API URL configured
- [ ] Production MSAL client ID configured
- [ ] Production tenant ID configured
- [ ] Production redirect URI configured
- [ ] Production API scope configured
- [ ] No client secrets in frontend
- [ ] No local development URLs remain

# Development Checklist

Before committing:

```powershell
dotnet build .ackend\WinCapture.csproj
```

```powershell
dotnet build .	ests\WinCapture.Tests.csproj
```

```powershell
dotnet test .	ests\WinCapture.Tests.csproj
```

Then:

```powershell
git status
```

Review staged files:

```powershell
git diff --cached --name-only
```

---

# Quick Start

## 1. Configure Microsoft Entra

Configure:

```text
Tenant ID
API Client ID
access_as_user scope
Frontend client ID
Frontend redirect URI
Swagger redirect URI if required
User group object ID
Admin group object ID
```

## 2. Configure the Backend

Set:

```text
ConnectionStrings:WinCaptureDatabase

AzureAd:Instance
AzureAd:TenantId
AzureAd:ApiClientId
AzureAd:Scope
AzureAd:Groups:User
AzureAd:Groups:Admin

WinCapture:CompanyDomain

Cors:AllowedOrigins

Storage:AccountName
Storage:ContainerName
```

## 3. Configure the Frontend

Create:

```text
frontend/.env
```

Set:

```env
VITE_API_BASE_URL=https://localhost:7106
VITE_MSAL_CLIENT_ID=<FRONTEND_CLIENT_ID>
VITE_MSAL_TENANT_ID=<TENANT_ID>
VITE_MSAL_REDIRECT_URI=https://localhost:5173/
VITE_MSAL_API_SCOPE=api://<API_CLIENT_ID>/access_as_user
```

## 4. Trust HTTPS

```powershell
dotnet dev-certs https --trust
```

## 5. Start Backend

```powershell
dotnet restore .ackend\WinCapture.csproj
dotnet build .ackend\WinCapture.csproj
dotnet run --project .ackend\WinCapture.csproj
```

## 6. Start Frontend

```powershell
cd frontend
npm install
npm run dev
```

## 7. Open WinCapture

```text
https://localhost:5173
```

## 8. Sign in with Microsoft

Use the Microsoft Entra sign-in flow.

## 9. Verify Current User

Call:

```text
GET /api/auth/me
```

Verify:

```text
User ID
Name
Email
Role
Authentication Provider
```

## 10. Verify Application Features

Verify:

```text
File upload
File listing
File retrieval
File download
File replacement
File deletion
Album creation
Album listing
Album sharing
Album access
Admin access
```

---

# End-to-End System Flow

```text
+------------------------+
|    React + Vite        |
|    TypeScript + MSAL   |
+-----------+------------+
            |
            | Sign in
            v
+------------------------+
|   Microsoft Entra ID   |
+-----------+------------+
            |
            | API access token
            v
+------------------------+
|    WinCapture API      |
|    ASP.NET Core .NET10 |
+-----------+------------+
            |
            +--------------------+
            |                    |
            v                    v
      +-----------+        +-------------+
      | SQL Server|        | Azure Blob  |
      | Metadata  |        | File Store  |
      +-----------+        +-------------+
```

---

# Final Architecture Summary

WinCapture uses:

```text
React
  |
  v
Microsoft Entra ID
  |
  | Microsoft Access Token
  v
ASP.NET Core .NET 10 API
  |
  +-- Authentication
  +-- Token Validation
  +-- Tenant Validation
  +-- Audience Validation
  +-- Scope Validation
  +-- Domain Validation
  +-- Role Mapping
  +-- User Provisioning
  +-- Authorization
  +-- Albums
  +-- Files
  |
  +---------------------+
  |                     |
  v                     v
SQL Server         Azure Blob Storage
```

Microsoft Entra ID is the authentication provider.

The backend validates Microsoft-issued access tokens directly.

WinCapture users and roles are managed by the application based on the authenticated Microsoft identity and configured group mapping.

SQL Server stores application metadata.

Azure Blob Storage stores physical uploaded files.

The application validates authentication, authorization, file behavior, album behavior, storage behavior, and security-related scenarios through the backend.
