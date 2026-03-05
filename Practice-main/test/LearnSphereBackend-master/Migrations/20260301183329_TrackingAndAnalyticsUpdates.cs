using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class TrackingAndAnalyticsUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LiveSessionAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LiveSessionId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveSessionAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveSessionAttendances_LiveSessions_LiveSessionId",
                        column: x => x.LiveSessionId,
                        principalTable: "LiveSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LiveSessionAttendances_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessionAttendances_LiveSessionId_StudentId",
                table: "LiveSessionAttendances",
                columns: new[] { "LiveSessionId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LiveSessionAttendances_StudentId",
                table: "LiveSessionAttendances",
                column: "StudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LiveSessionAttendances");
        }
    }
}
