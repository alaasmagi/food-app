using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace DataAccess;

internal static class PostgresErrors
{
    // A unique-constraint hit means the row (an already-processed envelope id, or an already-recorded
    // send) exists — the caller treats it as "already done", not as an error to retry.
    public static bool IsUniqueViolation(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
    }
}
