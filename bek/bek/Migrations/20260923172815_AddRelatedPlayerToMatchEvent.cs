using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace bek.Migrations
{
    /// <inheritdoc />
    public partial class AddRelatedPlayerToMatchEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedPlayerId",
                table: "MatchEvents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MatchEvents_RelatedPlayerId",
                table: "MatchEvents",
                column: "RelatedPlayerId");

            migrationBuilder.AddForeignKey(
                name: "FK_MatchEvents_Players_RelatedPlayerId",
                table: "MatchEvents",
                column: "RelatedPlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MatchEvents_Players_RelatedPlayerId",
                table: "MatchEvents");

            migrationBuilder.DropIndex(
                name: "IX_MatchEvents_RelatedPlayerId",
                table: "MatchEvents");

            migrationBuilder.DropColumn(
                name: "RelatedPlayerId",
                table: "MatchEvents");
        }
    }
}
