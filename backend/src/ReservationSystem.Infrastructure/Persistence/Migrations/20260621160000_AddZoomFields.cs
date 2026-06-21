using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ReservationSystem.Infrastructure.Persistence;

#nullable disable

namespace ReservationSystem.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260621160000_AddZoomFields")]
    public partial class AddZoomFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ZoomLink",
                table: "Services",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZoomMeetingId",
                table: "Services",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ZoomPassword",
                table: "Services",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ZoomLink",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ZoomMeetingId",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "ZoomPassword",
                table: "Services");
        }
    }
}
