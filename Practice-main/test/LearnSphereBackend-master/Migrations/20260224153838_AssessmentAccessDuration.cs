using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class AssessmentAccessDuration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccessDurationDays",
                table: "Assessments",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccessDurationDays",
                table: "Assessments");
        }
    }
}
