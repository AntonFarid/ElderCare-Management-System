using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartElderlyCare.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamLeaderModuleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UpdatedById",
                table: "WorkSchedules",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_WorkSchedules_UpdatedById",
                table: "WorkSchedules",
                column: "UpdatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkSchedules_Users_UpdatedById",
                table: "WorkSchedules",
                column: "UpdatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkSchedules_Users_UpdatedById",
                table: "WorkSchedules");

            migrationBuilder.DropIndex(
                name: "IX_WorkSchedules_UpdatedById",
                table: "WorkSchedules");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "WorkSchedules");
        }
    }
}
