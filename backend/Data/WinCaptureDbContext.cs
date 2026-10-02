using Microsoft.EntityFrameworkCore;
using WinCapture.Models;

namespace WinCapture.Data;

public sealed class WinCaptureDbContext(
    DbContextOptions<WinCaptureDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users =>
        Set<User>();

    public DbSet<FileMetadata> Files =>
        Set<FileMetadata>();

    public DbSet<Album> Albums =>
        Set<Album>();

    public DbSet<AlbumAccess> AlbumAccess =>
        Set<AlbumAccess>();

    public DbSet<Favorite> Favorites =>
        Set<Favorite>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(user => user.Id);

            entity.Property(user => user.Id)
                .ValueGeneratedOnAdd();

            entity.Property(user => user.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(320)
                .IsRequired();

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.Property(user => user.EntraObjectId)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(user => user.EntraObjectId)
                .IsUnique();

            entity.Property(user => user.Role)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(user => user.CreatedAt)
                .HasColumnType("datetime2")
                .IsRequired();
        });

        modelBuilder.Entity<FileMetadata>(entity =>
        {
            entity.ToTable("Files");

            entity.HasKey(file => file.Id);

            entity.Property(file => file.Id)
                .ValueGeneratedOnAdd();

            entity.Property(file => file.OriginalFileName)
                .HasMaxLength(260)
                .IsRequired();

            entity.Property(file => file.StoredFileName)
                .HasMaxLength(260)
                .IsRequired();

            entity.HasIndex(file => file.StoredFileName)
                .IsUnique();

            entity.Property(file => file.ContentType)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(file => file.FileSize)
                .IsRequired();

            entity.Property(file => file.UploadedBy)
                .IsRequired();

            entity.Property(file => file.AlbumId);

            entity.Property(file => file.UploadedAt)
                .HasColumnType("datetime2")
                .IsRequired();

            entity.HasIndex(file => file.UploadedBy);

            entity.HasIndex(file => file.AlbumId);

            entity.HasIndex(file => file.UploadedAt);

            entity.HasOne(file => file.User)
                .WithMany(user => user.Files)
                .HasForeignKey(file => file.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(file => file.Album)
                .WithMany(album => album.Files)
                .HasForeignKey(file => file.AlbumId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Album>(entity =>
        {
            entity.ToTable("Albums");

            entity.HasKey(album => album.Id);

            entity.Property(album => album.Id)
                .ValueGeneratedOnAdd();

            entity.Property(album => album.AlbumName)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(album => album.CreatedAt)
                .HasColumnType("datetime2")
                .IsRequired();

            entity.Property(album => album.UpdatedAt)
                .HasColumnType("datetime2");

            entity.HasIndex(album => album.CreatedBy);

            entity.HasOne(album => album.Owner)
                .WithMany(user => user.Albums)
                .HasForeignKey(album => album.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(album => album.UpdatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AlbumAccess>(entity =>
        {
            entity.ToTable("AlbumAccess");

            entity.HasKey(access => access.Id);

            entity.Property(access => access.Id)
                .ValueGeneratedOnAdd();

            entity.Property(access => access.GrantedAt)
                .HasColumnType("datetime2")
                .IsRequired();

            entity.HasIndex(
                access => new
                {
                    access.AlbumId,
                    access.UserId
                })
                .IsUnique();

            entity.HasIndex(access => access.UserId);

            entity.HasOne(access => access.Album)
                .WithMany(album => album.Access)
                .HasForeignKey(access => access.AlbumId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(access => access.User)
                .WithMany(user => user.AlbumAccess)
                .HasForeignKey(access => access.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(access => access.GrantedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.ToTable("Favorites");

            entity.HasKey(favorite =>
                new
                {
                    favorite.UserId,
                    favorite.FileId
                });

            entity.Property(favorite => favorite.FavoritedAt)
                .HasColumnType("datetime2")
                .IsRequired();

            entity.HasIndex(favorite => favorite.FileId);

            entity.HasOne(favorite => favorite.User)
                .WithMany(user => user.Favorites)
                .HasForeignKey(favorite => favorite.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(favorite => favorite.File)
                .WithMany(file => file.Favorites)
                .HasForeignKey(favorite => favorite.FileId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}