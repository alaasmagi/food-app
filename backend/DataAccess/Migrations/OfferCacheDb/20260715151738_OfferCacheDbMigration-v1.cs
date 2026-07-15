using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations.OfferCacheDb
{
    /// <inheritdoc />
    public partial class OfferCacheDbMigrationv1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OfferCache",
                columns: table => new
                {
                    RestaurantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BusinessDate = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    OffersJson = table.Column<string>(type: "TEXT", nullable: false),
                    FetchedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferCache", x => x.RestaurantId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OfferCache");
        }
    }
}
