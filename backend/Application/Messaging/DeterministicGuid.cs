using System.Security.Cryptography;
using System.Text;

namespace Application.Messaging;

// RFC 4122 name-based UUID version 5 (SHA-1). Used to derive the envelope `id` for a daily mail
// deterministically from the send identity ({userId}:{localDate}), so a batch re-run after a crash
// produces the same id and email-hub deduplicates the repeat instead of sending a second email.
// Guid.NewGuid() per publish would make every re-run a fresh set of messages.
public static class DeterministicGuid
{
    // Fixed namespace for this service's messaging ids. Never change it: changing the namespace
    // changes every derived id and breaks dedup against already-sent mail.
    public static readonly Guid LunchRecommendationNamespace =
        Guid.Parse("1e6d1f9a-3c2b-4f5e-9a0d-7c8b6e5f4a3b");

    public static Guid CreateV5(Guid namespaceId, string name)
    {
        var namespaceBytes = namespaceId.ToByteArray();
        SwapToBigEndian(namespaceBytes);

        var nameBytes = Encoding.UTF8.GetBytes(name);
        var data = new byte[namespaceBytes.Length + nameBytes.Length];
        Buffer.BlockCopy(namespaceBytes, 0, data, 0, namespaceBytes.Length);
        Buffer.BlockCopy(nameBytes, 0, data, namespaceBytes.Length, nameBytes.Length);

        var hash = SHA1.HashData(data);

        var result = new byte[16];
        Array.Copy(hash, 0, result, 0, 16);
        // Version 5 in the high nibble of byte 6, RFC 4122 variant in the top bits of byte 8.
        result[6] = (byte)((result[6] & 0x0F) | (5 << 4));
        result[8] = (byte)((result[8] & 0x3F) | 0x80);

        SwapToBigEndian(result);
        return new Guid(result);
    }

    // Guid stores its first three fields little-endian on this platform; UUID hashing works on the
    // big-endian (network-order) byte layout. The swap is its own inverse, so the same routine
    // converts in both directions.
    private static void SwapToBigEndian(byte[] guid)
    {
        (guid[0], guid[3]) = (guid[3], guid[0]);
        (guid[1], guid[2]) = (guid[2], guid[1]);
        (guid[4], guid[5]) = (guid[5], guid[4]);
        (guid[6], guid[7]) = (guid[7], guid[6]);
    }
}
