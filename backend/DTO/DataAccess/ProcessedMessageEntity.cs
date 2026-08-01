using System.ComponentModel.DataAnnotations;

namespace DTO.DataAccess;

// Consumer idempotency ledger for identity-hub events. The envelope `id` is the primary key; the
// consumer inserts the row in the same transaction as the projected user change, so a redelivery
// (RabbitMQ is at-least-once) hits the unique key and is acked without re-applying. Only envelope
// metadata is stored — never the message body.
public class ProcessedMessageEntity
{
    [Key]
    public Guid Id { get; set; }

    public DateTime ProcessedAtUtc { get; set; }

    [MaxLength(128)]
    public string Source { get; set; } = default!;

    [MaxLength(128)]
    public string Action { get; set; } = default!;
}
