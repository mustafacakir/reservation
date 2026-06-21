using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ReservationSystem.Infrastructure.Persistence;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260621200000_AddIsEmailSubscribed")]
public partial class AddIsEmailSubscribed : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsEmailSubscribed",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "IsEmailSubscribed", table: "Users");
    }
}
