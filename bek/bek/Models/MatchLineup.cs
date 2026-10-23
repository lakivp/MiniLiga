using System.ComponentModel.DataAnnotations.Schema;

namespace bek.Models;

public class MatchLineup
{
    public int Id { get; set; }

    // Utakmica
    public int MatchId { get; set; }

    public Match Match { get; set; } = null!;

    // Igrač
    public int PlayerId { get; set; }

    public Player Player { get; set; } = null!;

    // Tim za koji igrač nastupa na ovoj utakmici
    public int TeamId { get; set; }

    public Team Team { get; set; } = null!;

    // Da li je igrač u početnoj postavi
    public bool IsStarter { get; set; }

    // Da li je igrač na klupi
    public bool IsSubstitute { get; set; }

    // Pozicija na terenu.
    // Npr:
    // GK
    // DEF
    // MID
    // FWD
    //
    // Kasnije možemo imati i konkretne pozicije:
    // GK, LB, CB, RB, LM, CM, RM, LW, ST...
    public string? Position { get; set; }

    // Redosled igrača u sastavu.
    // Koristiće nam za prikaz u Angularu.
    public int Order { get; set; }

    // Minut ulaska u igru.
    // Ako je igrač starter, obično je null.
    // Ako ulazi kao izmena, ovde možemo staviti minut.
    public int? EnteredMinute { get; set; }

    // Minut izlaska iz igre.
    public int? LeftMinute { get; set; }

    // Dodatna napomena.
    public string? Notes { get; set; }
}