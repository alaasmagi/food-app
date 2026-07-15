using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class AddSendNotificationsAndNotificationEnvironment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DailyLunchRecommendationsEnabled",
                schema: "app",
                table: "AppUsers",
                newName: "SendNotifications");

            migrationBuilder.AddColumn<Guid>(
                name: "NotificationEnvironmentId",
                schema: "app",
                table: "AppUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_NotificationEnvironmentId",
                schema: "app",
                table: "AppUsers",
                column: "NotificationEnvironmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppUsers_DiningEnvironments_NotificationEnvironmentId",
                schema: "app",
                table: "AppUsers",
                column: "NotificationEnvironmentId",
                principalSchema: "app",
                principalTable: "DiningEnvironments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppUsers_DiningEnvironments_NotificationEnvironmentId",
                schema: "app",
                table: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_AppUsers_NotificationEnvironmentId",
                schema: "app",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "NotificationEnvironmentId",
                schema: "app",
                table: "AppUsers");

            migrationBuilder.RenameColumn(
                name: "SendNotifications",
                schema: "app",
                table: "AppUsers",
                newName: "DailyLunchRecommendationsEnabled");
        }
    }
}
