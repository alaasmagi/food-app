using System.ComponentModel.DataAnnotations;

namespace DTO.DataAccess;

// Local record of daily lunch-recommendation mail that the broker confirmed. The primary key is the
// deterministic envelope `id`; a unique (UserId, LocalDate) index makes a same-day re-run send
// nothing the second time. A row is written only after a confirmed publish, so a publish counts as
// done only once the broker accepts it.
public class PublishedRecommendationEntity
{
    [Key]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public DateOnly LocalDate { get; set; }

    public DateTime PublishedAtUtc { get; set; }
}
