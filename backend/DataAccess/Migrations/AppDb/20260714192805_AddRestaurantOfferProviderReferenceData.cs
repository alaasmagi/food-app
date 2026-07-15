using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class AddRestaurantOfferProviderReferenceData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "app");

            migrationBuilder.CreateTable(
                name: "OfferProviders",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ProviderType = table.Column<int>(type: "integer", nullable: false),
                    OfferLocator = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    OfferTextLocator = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    OfferPriceLocator = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferProviders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Restaurants",
                schema: "app",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    City = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    OfferTimeText = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    ParkingInfo = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    OpeningInfo = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    HasOffers = table.Column<bool>(type: "boolean", nullable: false),
                    IsFastFood = table.Column<bool>(type: "boolean", nullable: false),
                    OffersResourceUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    OfferProviderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Restaurants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Restaurants_OfferProviders_OfferProviderId",
                        column: x => x.OfferProviderId,
                        principalSchema: "app",
                        principalTable: "OfferProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OfferProviders_Name",
                schema: "app",
                table: "OfferProviders",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_City",
                schema: "app",
                table: "Restaurants",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_Name",
                schema: "app",
                table: "Restaurants",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_OfferProviderId",
                schema: "app",
                table: "Restaurants",
                column: "OfferProviderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Restaurants",
                schema: "app");

            migrationBuilder.DropTable(
                name: "OfferProviders",
                schema: "app");
        }
    }
}
