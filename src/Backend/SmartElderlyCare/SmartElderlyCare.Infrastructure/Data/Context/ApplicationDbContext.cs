using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Common;

namespace SmartElderlyCare.Infrastructure.Data.Context;

/// <summary>
/// Database context for the application
/// Uses IdentityFramework with custom User and Role
/// </summary>
public class ApplicationDbContext : IdentityDbContext<User, Role, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for domain entities
    public DbSet<Elderly> Elderlies { get; set; }
    public DbSet<DailyReport> DailyReports { get; set; }
    public DbSet<HealthMetric> HealthMetrics { get; set; }
    public DbSet<EmployeeElderlyAssignment> EmployeeElderlyAssignments { get; set; }
    public DbSet<ElderlyFamilyMember> ElderlyFamilyMembers { get; set; }
    public DbSet<WorkSchedule> WorkSchedules { get; set; }
    public DbSet<AttendanceLog> AttendanceLogs { get; set; }
    public DbSet<VisitRequest> VisitRequests { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    // Add AuditLog DbSet
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all configurations from this assembly
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Global query filter for soft delete
        builder.Entity<User>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Elderly>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<DailyReport>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<EmployeeElderlyAssignment>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ElderlyFamilyMember>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<WorkSchedule>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<VisitRequest>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Notification>().HasQueryFilter(e => !e.IsDeleted);
        // AuditLogs are not soft deleted - they are permanent records

        // Configure Identity tables with custom names
        builder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserType).HasConversion<int>();
        });

        builder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
        });

        builder.Entity<IdentityUserRole<int>>(entity =>
        {
            entity.ToTable("UserRoles");
        });

        builder.Entity<IdentityUserClaim<int>>(entity =>
        {
            entity.ToTable("UserClaims");
        });

        builder.Entity<IdentityUserLogin<int>>(entity =>
        {
            entity.ToTable("UserLogins");
        });

        builder.Entity<IdentityRoleClaim<int>>(entity =>
        {
            entity.ToTable("RoleClaims");
        });

        builder.Entity<IdentityUserToken<int>>(entity =>
        {
            entity.ToTable("UserTokens");
        });

        // Configure AuditLog
        builder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
            entity.Property(e => e.EntityName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Timestamp).IsRequired();

            // Relationship with User (optional)
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Indexes for faster queries
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.EntityName);
            entity.HasIndex(e => e.EntityId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Action);
        });

        // Configure relationships and constraints
        ConfigureRelationships(builder);
    }

    private void ConfigureRelationships(ModelBuilder builder)
    {
        // User - DailyReport (Employee submitting reports)
        builder.Entity<DailyReport>()
            .HasOne(d => d.Employee)
            .WithMany(u => u.DailyReports)
            .HasForeignKey(d => d.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - DailyReport (Team Leader approving)
        builder.Entity<DailyReport>()
            .HasOne(d => d.ApprovedBy)
            .WithMany(u => u.ApprovedReports)
            .HasForeignKey(d => d.ApprovedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Elderly - DailyReport
        builder.Entity<DailyReport>()
            .HasOne(d => d.Elderly)
            .WithMany(e => e.DailyReports)
            .HasForeignKey(d => d.ElderlyId)
            .OnDelete(DeleteBehavior.Restrict);

        // DailyReport - HealthMetric
        builder.Entity<HealthMetric>()
            .HasOne(h => h.DailyReport)
            .WithMany(d => d.HealthMetrics)
            .HasForeignKey(h => h.DailyReportId)
            .OnDelete(DeleteBehavior.Cascade);

        // Employee - Elderly (many-to-many through assignments)
        builder.Entity<EmployeeElderlyAssignment>()
            .HasKey(e => new { e.EmployeeId, e.ElderlyId });

        builder.Entity<EmployeeElderlyAssignment>()
            .HasOne(e => e.Employee)
            .WithMany(u => u.EmployeeAssignments)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<EmployeeElderlyAssignment>()
            .HasOne(e => e.Elderly)
            .WithMany(e => e.EmployeeAssignments)
            .HasForeignKey(e => e.ElderlyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Elderly - Family (many-to-many through family links)
        builder.Entity<ElderlyFamilyMember>()
            .HasKey(e => new { e.ElderlyId, e.FamilyMemberId });

        builder.Entity<ElderlyFamilyMember>()
            .HasOne(e => e.Elderly)
            .WithMany(e => e.FamilyMembers)
            .HasForeignKey(e => e.ElderlyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ElderlyFamilyMember>()
            .HasOne(e => e.FamilyMember)
            .WithMany(u => u.FamilyLinks)
            .HasForeignKey(e => e.FamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        // User - WorkSchedule
        builder.Entity<WorkSchedule>()
            .HasOne(w => w.Employee)
            .WithMany(u => u.WorkSchedules)
            .HasForeignKey(w => w.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkSchedule>()
            .HasOne(w => w.CreatedBy)
            .WithMany()
            .HasForeignKey(w => w.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkSchedule>()
            .HasOne(w => w.UpdatedBy)
            .WithMany()
            .HasForeignKey(w => w.UpdatedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Tell EF Core to ignore the string properties from BaseEntity
        builder.Entity<WorkSchedule>().Ignore(w => w.CreatedBy);
        builder.Entity<WorkSchedule>().Ignore(w => w.UpdatedBy);

        // User - AttendanceLog
        builder.Entity<AttendanceLog>()
            .HasOne(a => a.Employee)
            .WithMany(u => u.AttendanceLogs)
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        // VisitRequest relationships
        builder.Entity<VisitRequest>()
            .HasOne(v => v.FamilyMember)
            .WithMany()
            .HasForeignKey(v => v.FamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<VisitRequest>()
            .HasOne(v => v.Elderly)
            .WithMany(e => e.VisitRequests)
            .HasForeignKey(v => v.ElderlyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<VisitRequest>()
            .HasOne(v => v.ApprovedBy)
            .WithMany()
            .HasForeignKey(v => v.ApprovedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Notification relationship
        builder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete indexes
        builder.Entity<User>().HasIndex(u => u.IsDeleted);
        builder.Entity<Elderly>().HasIndex(e => e.IsDeleted);
        builder.Entity<DailyReport>().HasIndex(d => d.IsDeleted);
        builder.Entity<EmployeeElderlyAssignment>().HasIndex(e => e.IsDeleted);
        builder.Entity<ElderlyFamilyMember>().HasIndex(e => e.IsDeleted);
        builder.Entity<WorkSchedule>().HasIndex(w => w.IsDeleted);
        builder.Entity<VisitRequest>().HasIndex(v => v.IsDeleted);
        builder.Entity<Notification>().HasIndex(n => n.IsDeleted);

        // Unique constraints
        builder.Entity<User>().HasIndex(u => u.Email).IsUnique();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Automatically set audit fields on BaseEntity (CreatedAt/UpdatedAt)
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        // Set audit user fields for IAuditableEntity (CreatedBy/UpdatedBy) from context if available.
        // Do NOT set CreatedAt/UpdatedAt here because IAuditableEntity does not declare those properties.
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    // entry.Entity.CreatedBy = currentUserId; // set from your auth/context
                    break;
                case EntityState.Modified:
                    // entry.Entity.UpdatedBy = currentUserId; // set from your auth/context
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}