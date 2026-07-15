using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class AddDailyLunchRecommendationsEnabled : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DailyLunchRecommendationsEnabled",
                schema: "app",
                table: "AppUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DailyLunchRecommendationsEnabled",
                schema: "app",
                table: "AppUsers");
        }
    }
}
