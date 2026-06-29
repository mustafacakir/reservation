using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
/// <inheritdoc />
public partial class AddMessaging : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Messages",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                FromUserId = table.Column<Guid>(type: "uuid", nullable: false),
                ToUserId = table.Column<Guid>(type: "uuid", nullable: false),
                ToProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                SentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                IsRead = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Messages", x => x.Id);
                table.ForeignKey(
                    name: "FK_Messages_Users_FromUserId",
                    column: x => x.FromUserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Messages_Users_ToUserId",
                    column: x => x.ToUserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Messages_FromUserId",
            table: "Messages",
            column: "FromUserId");

        migrationBuilder.CreateIndex(
            name: "IX_Messages_TenantId_FromUserId_ToUserId_SentAt",
            table: "Messages",
            columns: new[] { "TenantId", "FromUserId", "ToUserId", "SentAt" });

        migrationBuilder.CreateIndex(
            name: "IX_Messages_TenantId_ToUserId_IsRead",
            table: "Messages",
            columns: new[] { "TenantId", "ToUserId", "IsRead" });

        migrationBuilder.CreateIndex(
            name: "IX_Messages_ToUserId",
            table: "Messages",
            column: "ToUserId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Messages");
    }
}
