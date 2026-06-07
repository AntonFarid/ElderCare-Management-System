using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartElderlyCare.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConnectionCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkSchedules_Users_CreatedById",
                table: "WorkSchedules");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkSchedules_Users_UpdatedById",
                table: "WorkSchedules");

            migrationBuilder.DropIndex(
                name: "IX_WorkSchedules_CreatedById",
                table: "WorkSchedules");

            migrationBuilder.DropIndex(
                name: "IX_WorkSchedules_UpdatedById",
                table: "WorkSchedules");

            migrationBuilder.AlterColumn<int>(
                name: "UpdatedById",
                table: "WorkSchedules",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "ConnectionCode",
                table: "Elderlies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConnectionCode",
                table: "Elderlies");

            migrationBuilder.AlterColumn<int>(
                name: "UpdatedById",
                table: "WorkSchedules",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkSchedules_CreatedById",
                table: "WorkSchedules",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_WorkSchedules_UpdatedById",
                table: "WorkSchedules",
                column: "UpdatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkSchedules_Users_CreatedById",
                table: "WorkSchedules",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkSchedules_Users_UpdatedById",
                table: "WorkSchedules",
                column: "UpdatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
