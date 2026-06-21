using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ReservationSystem.Infrastructure.Persistence;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260621210000_AddSocialLinks")]
public partial class AddSocialLinks : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
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
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "InstagramUrl", table: "ServiceProviders");
        migrationBuilder.DropColumn(name: "LinkedInUrl", table: "ServiceProviders");
    }
}
