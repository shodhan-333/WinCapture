# WinCapture

File Upload and Gallery Platform.

## Backend

ASP.NET Core Web API running on .NET 10.

## Technology Stack

- C#
- .NET 10
- ASP.NET Core
- Entity Framework Core
- SQL Server

## Database setup

This project does not use EF Core migrations. Create the database from the SQL script:

`database/WinCaptureDb.sql`

Then put your SQL Server connection string in `backend/WinCapture/appsettings.Development.json` under `ConnectionStrings:WinCaptureDatabase`.

Example:

```json
"ConnectionStrings": {
  "WinCaptureDatabase": "Server=YOUR_SERVER;Database=WinCaptureDevDB;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

The SQL script creates the `WinCaptureDevDB` database, `Users` and `Files` tables, their indexes, and the foreign-key relationship.
