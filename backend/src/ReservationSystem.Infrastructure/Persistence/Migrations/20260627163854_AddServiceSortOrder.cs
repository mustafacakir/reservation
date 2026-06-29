using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
/// <inheritdoc />
public partial class AddServiceSortOrder : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SortOrder",
            table: "Services",
            type: "integer",
            nullable: false,
            defaultValue: 0);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "SortOrder",
            table: "Services");
    }
}
