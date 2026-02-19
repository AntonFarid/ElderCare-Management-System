using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.Infrastructure.Data.Seeds;

/// <summary>
/// Seeder for initial database data
/// </summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        // Ensure database is created
        await context.Database.MigrateAsync();

        // Seed Roles
        await SeedRolesAsync(roleManager);

        // Seed Admin User
        await SeedAdminUserAsync(userManager);

        // Seed sample data for development
        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
        {
            await SeedSampleDataAsync(context, userManager);
        }
    }

    private static async Task SeedRolesAsync(RoleManager<Role> roleManager)
    {
        var roles = new[]
        {
            new Role { Name = "Admin", Description = "System Administrator" },
            new Role { Name = "TeamLeader", Description = "Team Leader" },
            new Role { Name = "Employee", Description = "Care Employee" },
            new Role { Name = "FamilyMember", Description = "Family Member" }
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role.Name))
            {
                await roleManager.CreateAsync(role);
            }
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<User> userManager)
    {
        var adminEmail = "admin@smartcare.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "System",
                LastName = "Administrator",
                UserType = UserType.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }

    private static async Task SeedSampleDataAsync(ApplicationDbContext context, UserManager<User> userManager)
    {
        // Seed Elderly residents
        if (!context.Elderlies.Any())
        {
            var elderly1 = new Elderly
            {
                FirstName = "John",
                LastName = "Smith",
                DateOfBirth = new DateTime(1940, 5, 15),
                RoomNumber = "101",
                EmergencyContact = "+1234567890",
                MedicalConditions = "Hypertension, Diabetes Type 2",
                Allergies = "Penicillin",
                DietaryRestrictions = "Low sodium, No sugar",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            var elderly2 = new Elderly
            {
                FirstName = "Mary",
                LastName = "Johnson",
                DateOfBirth = new DateTime(1945, 8, 22),
                RoomNumber = "102",
                EmergencyContact = "+1234567891",
                MedicalConditions = "Arthritis, Mild dementia",
                Allergies = "None",
                DietaryRestrictions = "Soft food",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            await context.Elderlies.AddRangeAsync(elderly1, elderly2);
            await context.SaveChangesAsync();
        }

        // Seed Employee users
        if (!context.Users.Any(u => u.UserType == UserType.Employee))
        {
            var employee1 = new User
            {
                UserName = "employee1@smartcare.com",
                Email = "employee1@smartcare.com",
                FirstName = "Sarah",
                LastName = "Wilson",
                UserType = UserType.Employee,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                EmailConfirmed = true
            };

            var employee2 = new User
            {
                UserName = "employee2@smartcare.com",
                Email = "employee2@smartcare.com",
                FirstName = "Michael",
                LastName = "Brown",
                UserType = UserType.Employee,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                EmailConfirmed = true
            };

            var result1 = await userManager.CreateAsync(employee1, "Employee@123456");
            if (result1.Succeeded)
            {
                await userManager.AddToRoleAsync(employee1, "Employee");
            }

            var result2 = await userManager.CreateAsync(employee2, "Employee@123456");
            if (result2.Succeeded)
            {
                await userManager.AddToRoleAsync(employee2, "Employee");
            }
        }

        // Seed Team Leader
        if (!context.Users.Any(u => u.UserType == UserType.TeamLeader))
        {
            var teamLeader = new User
            {
                UserName = "teamleader@smartcare.com",
                Email = "teamleader@smartcare.com",
                FirstName = "David",
                LastName = "Miller",
                UserType = UserType.TeamLeader,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(teamLeader, "TeamLeader@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(teamLeader, "TeamLeader");
            }
        }

        // Seed Family Members
        if (!context.Users.Any(u => u.UserType == UserType.FamilyMember))
        {
            var familyMember1 = new User
            {
                UserName = "family1@example.com",
                Email = "family1@example.com",
                FirstName = "Robert",
                LastName = "Smith",
                UserType = UserType.FamilyMember,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(familyMember1, "Family@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(familyMember1, "FamilyMember");
            }
        }

        // Seed Employee-Elderly Assignments
        if (!context.EmployeeElderlyAssignments.Any())
        {
            var employees = context.Users.Where(u => u.UserType == UserType.Employee).ToList();
            var elderly = context.Elderlies.ToList();

            if (employees.Any() && elderly.Any())
            {
                var assignments = new List<EmployeeElderlyAssignment>
                {
                    new EmployeeElderlyAssignment
                    {
                        EmployeeId = employees[0].Id,
                        ElderlyId = elderly[0].Id,
                        AssignedDate = DateTime.UtcNow,
                        IsPrimary = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new EmployeeElderlyAssignment
                    {
                        EmployeeId = employees[1].Id,
                        ElderlyId = elderly[1].Id,
                        AssignedDate = DateTime.UtcNow,
                        IsPrimary = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                await context.EmployeeElderlyAssignments.AddRangeAsync(assignments);
                await context.SaveChangesAsync();
            }
        }

        // Seed Elderly-Family Links
        if (!context.ElderlyFamilyMembers.Any())
        {
            var familyMember = context.Users.FirstOrDefault(u => u.UserType == UserType.FamilyMember);
            var elderly = context.Elderlies.FirstOrDefault();

            if (familyMember != null && elderly != null)
            {
                var familyLink = new ElderlyFamilyMember
                {
                    ElderlyId = elderly.Id,
                    FamilyMemberId = familyMember.Id,
                    Relationship = "Son",
                    IsPrimaryContact = true,
                    CanScheduleVisits = true,
                    CreatedAt = DateTime.UtcNow
                };

                await context.ElderlyFamilyMembers.AddAsync(familyLink);
                await context.SaveChangesAsync();
            }
        }
    }
}