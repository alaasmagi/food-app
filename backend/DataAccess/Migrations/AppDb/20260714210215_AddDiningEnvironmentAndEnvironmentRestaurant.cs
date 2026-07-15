using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class AddDiningEnvironmentAndEnvironmentRestaurant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiningEnvironments",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiningEnvironments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EnvironmentRestaurants",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EnvironmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnvironmentRestaurants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EnvironmentRestaurants_DiningEnvironments_EnvironmentId",
                        column: x => x.EnvironmentId,
                        principalSchema: "app",
                        principalTable: "DiningEnvironments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EnvironmentRestaurants_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalSchema: "app",
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DiningEnvironments_UserId",
                schema: "app",
                table: "DiningEnvironments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentRestaurants_EnvironmentId",
                schema: "app",
                table: "EnvironmentRestaurants",
                column: "EnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentRestaurants_RestaurantId",
                schema: "app",
                table: "EnvironmentRestaurants",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentRestaurants_UserId_EnvironmentId_RestaurantId",
                schema: "app",
                table: "EnvironmentRestaurants",
                columns: new[] { "UserId", "EnvironmentId", "RestaurantId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnvironmentRestaurants",
                schema: "app");

            migrationBuilder.DropTable(
                name: "DiningEnvironments",
                schema: "app");
        }
    }
}
