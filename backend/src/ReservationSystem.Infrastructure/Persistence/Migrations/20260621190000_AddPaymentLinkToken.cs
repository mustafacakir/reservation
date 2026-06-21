using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ReservationSystem.Infrastructure.Persistence;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260621190000_AddPaymentLinkToken")]
public partial class AddPaymentLinkToken : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PaymentLinkToken",
            table: "Bookings",
            type: "text",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Bookings_PaymentLinkToken",
            table: "Bookings",
            column: "PaymentLinkToken",
            unique: true,
            filter: "\"PaymentLinkToken\" IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Bookings_PaymentLinkToken",
            table: "Bookings");

        migrationBuilder.DropColumn(
            name: "PaymentLinkToken",
            table: "Bookings");
    }
}
