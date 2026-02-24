using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartElderlyCare.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "VisitRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "VisitRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "HealthMetrics",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "HealthMetrics",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "EmployeeElderlyAssignments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "EmployeeElderlyAssignments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "ElderlyFamilyMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "ElderlyFamilyMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "AttendanceLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "AttendanceLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: true),
                    OldValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkSchedules_IsDeleted",
                table: "WorkSchedules",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_VisitRequests_IsDeleted",
                table: "VisitRequests",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_IsDeleted",
                table: "Notifications",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeElderlyAssignments_IsDeleted",
                table: "EmployeeElderlyAssignments",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_ElderlyFamilyMembers_IsDeleted",
                table: "ElderlyFamilyMembers",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Action",
                table: "AuditLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityId",
                table: "AuditLogs",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityName",
                table: "AuditLogs",
                column: "EntityName");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_WorkSchedules_IsDeleted",
                table: "WorkSchedules");

            migrationBuilder.DropIndex(
                name: "IX_VisitRequests_IsDeleted",
                table: "VisitRequests");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_IsDeleted",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeElderlyAssignments_IsDeleted",
                table: "EmployeeElderlyAssignments");

            migrationBuilder.DropIndex(
                name: "IX_ElderlyFamilyMembers_IsDeleted",
                table: "ElderlyFamilyMembers");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "VisitRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "VisitRequests");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "HealthMetrics");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "HealthMetrics");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "EmployeeElderlyAssignments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "EmployeeElderlyAssignments");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "ElderlyFamilyMembers");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "ElderlyFamilyMembers");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "AttendanceLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "AttendanceLogs");
        }
    }
}
