using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AppDbMigrationv1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "food");

            migrationBuilder.CreateTable(
                name: "DiningEnvironments",
                schema: "food",
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
                name: "OfferProviders",
                schema: "food",
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
                name: "UserWheels",
                schema: "food",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    RestaurantNames = table.Column<string>(type: "jsonb", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserWheels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AppUsers",
                schema: "food",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FullName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Locale = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    SendNotifications = table.Column<bool>(type: "boolean", nullable: false),
                    NotificationEnvironmentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AppUsers_DiningEnvironments_NotificationEnvironmentId",
                        column: x => x.NotificationEnvironmentId,
                        principalSchema: "food",
                        principalTable: "DiningEnvironments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Restaurants",
                schema: "food",
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
                        principalSchema: "food",
                        principalTable: "OfferProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EnvironmentRestaurants",
                schema: "food",
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
                        principalSchema: "food",
                        principalTable: "DiningEnvironments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EnvironmentRestaurants_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalSchema: "food",
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Favourites",
                schema: "food",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RestaurantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ConcurrencyToken = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favourites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favourites_Restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalSchema: "food",
                        principalTable: "Restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Email",
                schema: "food",
                table: "AppUsers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_NotificationEnvironmentId",
                schema: "food",
                table: "AppUsers",
                column: "NotificationEnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Username",
                schema: "food",
                table: "AppUsers",
                column: "Username");

            migrationBuilder.CreateIndex(
                name: "IX_DiningEnvironments_UserId",
                schema: "food",
                table: "DiningEnvironments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentRestaurants_EnvironmentId",
                schema: "food",
                table: "EnvironmentRestaurants",
                column: "EnvironmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentRestaurants_RestaurantId",
                schema: "food",
                table: "EnvironmentRestaurants",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvironmentRestaurants_UserId_EnvironmentId_RestaurantId",
                schema: "food",
                table: "EnvironmentRestaurants",
                columns: new[] { "UserId", "EnvironmentId", "RestaurantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Favourites_RestaurantId",
                schema: "food",
                table: "Favourites",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_Favourites_UserId_RestaurantId",
                schema: "food",
                table: "Favourites",
                columns: new[] { "UserId", "RestaurantId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfferProviders_Name",
                schema: "food",
                table: "OfferProviders",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_City",
                schema: "food",
                table: "Restaurants",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_Name",
                schema: "food",
                table: "Restaurants",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Restaurants_OfferProviderId",
                schema: "food",
                table: "Restaurants",
                column: "OfferProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_UserWheels_UserId",
                schema: "food",
                table: "UserWheels",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUsers",
                schema: "food");

            migrationBuilder.DropTable(
                name: "EnvironmentRestaurants",
                schema: "food");

            migrationBuilder.DropTable(
                name: "Favourites",
                schema: "food");

            migrationBuilder.DropTable(
                name: "UserWheels",
                schema: "food");

            migrationBuilder.DropTable(
                name: "DiningEnvironments",
                schema: "food");

            migrationBuilder.DropTable(
                name: "Restaurants",
                schema: "food");

            migrationBuilder.DropTable(
                name: "OfferProviders",
                schema: "food");
        }
    }
}
