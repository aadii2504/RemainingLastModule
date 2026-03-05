using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Attendance",
                table: "Enrollments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AttendanceCount",
                table: "Enrollments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Compliance",
                table: "Enrollments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Grade",
                table: "Enrollments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "Score",
                table: "Enrollments",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Attendance",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "AttendanceCount",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Compliance",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Grade",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "Enrollments");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Courses");
        }
    }
}
