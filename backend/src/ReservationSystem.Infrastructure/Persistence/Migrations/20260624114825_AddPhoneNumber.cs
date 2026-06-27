using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
/// <inheritdoc />
public partial class AddPhoneNumber : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsEmailSubscribed",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "PhoneNumber",
            table: "Users",
            type: "character varying(20)",
            maxLength: 20,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "InstagramUrl",
            table: "ServiceProviders",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "LinkedInUrl",
            table: "ServiceProviders",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PaymentLinkToken",
            table: "Bookings",
            type: "text",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "IsEmailSubscribed",
            table: "Users");

        migrationBuilder.DropColumn(
            name: "PhoneNumber",
            table: "Users");

        migrationBuilder.DropColumn(
            name: "InstagramUrl",
            table: "ServiceProviders");

        migrationBuilder.DropColumn(
            name: "LinkedInUrl",
            table: "ServiceProviders");

        migrationBuilder.DropColumn(
            name: "PaymentLinkToken",
            table: "Bookings");
    }
}
