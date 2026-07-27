using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddDiningEnvironmentAutoFillFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "AutoFillLatitude",
                schema: "food",
                table: "DiningEnvironments",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "AutoFillLongitude",
                schema: "food",
                table: "DiningEnvironments",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AutoFillRadiusMeters",
                schema: "food",
                table: "DiningEnvironments",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoFillLatitude",
                schema: "food",
                table: "DiningEnvironments");

            migrationBuilder.DropColumn(
                name: "AutoFillLongitude",
                schema: "food",
                table: "DiningEnvironments");

            migrationBuilder.DropColumn(
                name: "AutoFillRadiusMeters",
                schema: "food",
                table: "DiningEnvironments");
        }
    }
}
