IF DB_ID(N'WinCaptureDevDB') IS NULL
    CREATE DATABASE WinCaptureDevDB;
GO

USE WinCaptureDevDB;
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        Id int IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Users PRIMARY KEY,

        Name nvarchar(200) NOT NULL,

        Email nvarchar(320) NOT NULL,

        PasswordHash nvarchar(500) NOT NULL,

        Role nvarchar(20) NOT NULL,

        CreatedAt datetime2 NOT NULL
    );

    CREATE UNIQUE INDEX IX_Users_Email
        ON dbo.Users(Email);
END;
GO

IF OBJECT_ID(N'dbo.Files', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Files
    (
        Id bigint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Files PRIMARY KEY,

        OriginalFileName nvarchar(260) NOT NULL,

        StoredFileName nvarchar(260) NOT NULL,

        ContentType nvarchar(100) NOT NULL,

        FileSize bigint NOT NULL,

        UploadedBy int NOT NULL,

        AlbumId bigint NULL,

        UploadedAt datetime2 NOT NULL,

        CONSTRAINT FK_Files_Users_UploadedBy
            FOREIGN KEY (UploadedBy)
            REFERENCES dbo.Users(Id)
            ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX IX_Files_StoredFileName
        ON dbo.Files(StoredFileName);

    CREATE INDEX IX_Files_UploadedAt
        ON dbo.Files(UploadedAt);

    CREATE INDEX IX_Files_UploadedBy
        ON dbo.Files(UploadedBy);

    CREATE INDEX IX_Files_AlbumId
        ON dbo.Files(AlbumId);
END;
GO

IF OBJECT_ID(N'dbo.Albums', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Albums
    (
        Id bigint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_Albums PRIMARY KEY,

        AlbumName nvarchar(200) NOT NULL,

        CreatedBy int NOT NULL,

        CreatedAt datetime2 NOT NULL,

        UpdatedBy int NULL,

        UpdatedAt datetime2 NULL,

        CONSTRAINT FK_Albums_Users_CreatedBy
            FOREIGN KEY (CreatedBy)
            REFERENCES dbo.Users(Id)
            ON DELETE NO ACTION,

        CONSTRAINT FK_Albums_Users_UpdatedBy
            FOREIGN KEY (UpdatedBy)
            REFERENCES dbo.Users(Id)
            ON DELETE NO ACTION
    );

    CREATE INDEX IX_Albums_CreatedBy
        ON dbo.Albums(CreatedBy);
END;
GO

IF OBJECT_ID(N'dbo.AlbumAccess', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AlbumAccess
    (
        Id bigint IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_AlbumAccess PRIMARY KEY,

        AlbumId bigint NOT NULL,

        UserId int NOT NULL,

        CanView bit NOT NULL,

        CanDownload bit NOT NULL,

        GrantedAt datetime2 NOT NULL,

        GrantedBy int NOT NULL,

        CONSTRAINT FK_AlbumAccess_Albums_AlbumId
            FOREIGN KEY (AlbumId)
            REFERENCES dbo.Albums(Id)
            ON DELETE CASCADE,

        CONSTRAINT FK_AlbumAccess_Users_UserId
            FOREIGN KEY (UserId)
            REFERENCES dbo.Users(Id)
            ON DELETE NO ACTION,

        CONSTRAINT FK_AlbumAccess_Users_GrantedBy
            FOREIGN KEY (GrantedBy)
            REFERENCES dbo.Users(Id)
            ON DELETE NO ACTION
    );

    CREATE UNIQUE INDEX IX_AlbumAccess_AlbumId_UserId
        ON dbo.AlbumAccess(AlbumId, UserId);

    CREATE INDEX IX_AlbumAccess_UserId
        ON dbo.AlbumAccess(UserId);
END;
GO

IF COL_LENGTH(N'dbo.Files', N'AlbumId') IS NULL
BEGIN
    ALTER TABLE dbo.Files
    ADD AlbumId bigint NULL;
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Files_AlbumId'
      AND object_id = OBJECT_ID(N'dbo.Files')
)
BEGIN
    CREATE INDEX IX_Files_AlbumId
        ON dbo.Files(AlbumId);
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_Files_Albums_AlbumId'
      AND parent_object_id = OBJECT_ID(N'dbo.Files')
)
BEGIN
    ALTER TABLE dbo.Files
    ADD CONSTRAINT FK_Files_Albums_AlbumId
        FOREIGN KEY (AlbumId)
        REFERENCES dbo.Albums(Id)
        ON DELETE CASCADE;
END;
GO