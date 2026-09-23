using Microsoft.EntityFrameworkCore;
using WinCapture.Models;

namespace WinCapture.Data;

public sealed class WinCaptureDbContext(DbContextOptions<WinCaptureDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<FileMetadata> Files => Set<FileMetadata>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
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

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(500)
                .IsRequired();

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

            entity.Property(file => file.UploadedAt)
                .HasColumnType("datetime2")
                .IsRequired();

            entity.HasIndex(file => file.UploadedBy);

            entity.HasIndex(file => file.UploadedAt);

            entity.HasOne(file => file.User)
                .WithMany(user => user.Files)
                .HasForeignKey(file => file.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
