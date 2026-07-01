using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
/// <inheritdoc />
public partial class AddServiceSeriesId : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "SeriesId",
            table: "Services",
            type: "uuid",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "SeriesId",
            table: "Services");
    }
}
