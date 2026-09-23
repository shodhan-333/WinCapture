IF DB_ID(N'WinCaptureDevDB') IS NULL
    CREATE DATABASE WinCaptureDevDB;
GO

USE WinCaptureDevDB;
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        Name nvarchar(200) NOT NULL,
        Email nvarchar(320) NOT NULL,
        PasswordHash nvarchar(500) NOT NULL,
        Role nvarchar(20) NOT NULL,
        CreatedAt datetime2 NOT NULL
    );

    CREATE UNIQUE INDEX IX_Users_Email ON dbo.Users(Email);
END;
GO

IF OBJECT_ID(N'dbo.Files', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Files (
        Id bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_Files PRIMARY KEY,
        OriginalFileName nvarchar(260) NOT NULL,
        StoredFileName nvarchar(260) NOT NULL,
        ContentType nvarchar(100) NOT NULL,
        FileSize bigint NOT NULL,
        UploadedBy int NOT NULL,
        UploadedAt datetime2 NOT NULL,
        CONSTRAINT FK_Files_Users_UploadedBy
            FOREIGN KEY (UploadedBy) REFERENCES dbo.Users(Id)
            ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX IX_Files_StoredFileName ON dbo.Files(StoredFileName);
    CREATE INDEX IX_Files_UploadedAt ON dbo.Files(UploadedAt);
    CREATE INDEX IX_Files_UploadedBy ON dbo.Files(UploadedBy);
END;
GO
