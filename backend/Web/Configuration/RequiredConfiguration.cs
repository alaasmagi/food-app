using System.Globalization;
using Base.Cache;
using Contracts.Application;
using Base.Keycloak.Authentication;
using Base.Message.RabbitMQ;
using External.RabbitMQ;

namespace Web.Configuration;

public static class RequiredConfiguration
{
    public static string AppConnectionString()
    {
        return Required(
            Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING"),
            "Application database connection string",
            "DATABASE_CONNECTION_STRING");
    }

    public static KeycloakOptions KeycloakOptions()
    {
        var authority = Required(
            Environment.GetEnvironmentVariable("KEYCLOAK_AUTHORITY"),
            "Keycloak authority",
            "KEYCLOAK_AUTHORITY");

        var clientId = Required(
            Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_ID"),
            "Keycloak client id",
            "KEYCLOAK_CLIENT_ID");

        return new KeycloakOptions
        {
            Authority = authority,
            ClientId = clientId,
            Audience = clientId,
            ClientSecret = Required(
                Environment.GetEnvironmentVariable("KEYCLOAK_CLIENT_SECRET"),
                "Keycloak client secret",
                "KEYCLOAK_CLIENT_SECRET"),
            RequireHttpsMetadata = !authority.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase) &&
                                   !authority.StartsWith("http://127.0.0.1", StringComparison.OrdinalIgnoreCase),
            IncludeClientRoles = true
        };
    }

    public static string FrontendOrigin()
    {
        return Required(
            Environment.GetEnvironmentVariable("FRONTEND_ORIGIN"),
            "Frontend origin",
            "FRONTEND_ORIGIN");
    }

    public static RabbitMqOptions RabbitMqOptions()
    {
        var uri = new Uri(Required(
            Environment.GetEnvironmentVariable("RABBITMQ_URI"),
            "RabbitMQ URI",
            "RABBITMQ_URI"));

        if (!uri.Scheme.Equals("amqp", StringComparison.OrdinalIgnoreCase) &&
            !uri.Scheme.Equals("amqps", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("RABBITMQ_URI must use amqp:// or amqps://.");
        }

        var credentials = uri.UserInfo.Split(':', 2);
        if (credentials.Length != 2 ||
            string.IsNullOrWhiteSpace(credentials[0]) ||
            string.IsNullOrWhiteSpace(credentials[1]))
        {
            throw new InvalidOperationException("RABBITMQ_URI must include username and password.");
        }

        return new RabbitMqOptions
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? DefaultRabbitMqPort(uri.Scheme) : uri.Port,
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = Uri.UnescapeDataString(credentials[1]),
            VirtualHost = RabbitMqVirtualHost(uri),
            Exchange = Required(
                Environment.GetEnvironmentVariable("RABBITMQ_EXCHANGE"),
                "RabbitMQ exchange",
                "RABBITMQ_EXCHANGE"),
            UseTls = uri.Scheme.Equals("amqps", StringComparison.OrdinalIgnoreCase)
        };
    }

    public static AppMessagingOptions AppMessagingOptions(KeycloakOptions keycloakOptions)
    {
        return new AppMessagingOptions
        {
            Queue = Required(
                Environment.GetEnvironmentVariable("RABBITMQ_QUEUE"),
                "RabbitMQ consumer queue",
                "RABBITMQ_QUEUE"),
            Source = Optional("APP_EVENT_SOURCE") ?? keycloakOptions.ClientId ?? KeycloakRealmName(keycloakOptions.Authority),
            IdentitySource = $"identity.{KeycloakRealmName(keycloakOptions.Authority)}",
            ConsumerRoutingKeys = OptionalList("RABBITMQ_CONSUMER_ROUTING_KEYS", ["user.*"])
        };
    }

    public static string? GlitchtipDsn() => Optional("GLITCHTIP_DSN");

    public static string GlitchtipRelease() => Optional("GLITCHTIP_RELEASE") ?? "dotnet-template";

    public static ApiRateLimitOptions ApiRateLimitOptions()
    {
        return new ApiRateLimitOptions(
            PermitLimit: OptionalPositiveInt("RATE_LIMIT_PERMIT_LIMIT", 100),
            WindowSeconds: OptionalPositiveInt("RATE_LIMIT_WINDOW_SECONDS", 60),
            QueueLimit: OptionalNonNegativeInt("RATE_LIMIT_QUEUE_LIMIT", 0));
    }

    public static ApiRateLimitOptions PublicApiRateLimitOptions()
    {
        // Stricter defaults than the authenticated policy (100/60s): the public read has no per-user
        // accounting, so the per-IP budget is kept low.
        return new ApiRateLimitOptions(
            PermitLimit: OptionalPositiveInt("PUBLIC_RATE_LIMIT_PERMIT_LIMIT", 20),
            WindowSeconds: OptionalPositiveInt("PUBLIC_RATE_LIMIT_WINDOW_SECONDS", 60),
            QueueLimit: OptionalNonNegativeInt("PUBLIC_RATE_LIMIT_QUEUE_LIMIT", 0));
    }

    public static string RedisConnectionString()
    {
        return Required(
            Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING"),
            "Redis connection string",
            "REDIS_CONNECTION_STRING");
    }

    public static BaseCacheOptions BaseCacheOptions()
    {
        return new BaseCacheOptions
        {
            KeyPrefix = Optional("CACHE_KEY_PREFIX") ?? "app-service",
            DefaultEntryOptions = new BaseCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(
                    OptionalPositiveInt("CACHE_DEFAULT_ABSOLUTE_EXPIRATION_SECONDS", 300))
            }
        };
    }

    public static string OfferCacheConnectionString(IConfiguration configuration)
    {
        return Optional("OFFER_CACHE_CONNECTION_STRING") ??
               OptionalConfiguration(configuration, "OfferCache:ConnectionString") ??
               "Data Source=offer-cache.db";
    }

    public static OfferCacheOptions OfferCacheOptions(IConfiguration configuration)
    {
        var ttlSeconds = OptionalPositiveInt(
            "OFFER_CACHE_TTL_SECONDS",
            OptionalConfigurationPositiveInt(configuration, "OfferCache:TtlSeconds", 3600));

        return new OfferCacheOptions
        {
            Ttl = TimeSpan.FromSeconds(ttlSeconds)
        };
    }

    public static DailyRecommendationScheduleOptions DailyRecommendationScheduleOptions()
    {
        var defaults = new DailyRecommendationScheduleOptions();

        var runTime = defaults.RunTime;
        var runTimeRaw = Optional("DAILY_RECOMMENDATION_RUN_TIME");
        if (runTimeRaw != null &&
            !TimeOnly.TryParse(runTimeRaw, CultureInfo.InvariantCulture, DateTimeStyles.None, out runTime))
        {
            throw new InvalidOperationException("DAILY_RECOMMENDATION_RUN_TIME must be a valid time, for example 08:00.");
        }

        return new DailyRecommendationScheduleOptions
        {
            RunTime = runTime,
            TimeZone = Optional("DAILY_RECOMMENDATION_TIME_ZONE") ?? defaults.TimeZone
        };
    }

    public static DailyRecommendationNotificationOptions DailyRecommendationNotificationOptions()
    {
        var defaults = new DailyRecommendationNotificationOptions();

        return new DailyRecommendationNotificationOptions
        {
            AppBaseUrl = Optional("DAILY_RECOMMENDATION_APP_BASE_URL") ?? defaults.AppBaseUrl,
            RestaurantPathTemplate = Optional("DAILY_RECOMMENDATION_RESTAURANT_PATH_TEMPLATE") ?? defaults.RestaurantPathTemplate,
            WheelPath = Optional("DAILY_RECOMMENDATION_WHEEL_PATH") ?? defaults.WheelPath,
            Currency = Optional("DAILY_RECOMMENDATION_CURRENCY") ?? defaults.Currency
        };
    }

    private static string? Optional(string key)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string[] OptionalList(string key, string[] fallback)
    {
        var value = Environment.GetEnvironmentVariable(key);
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        var values = value
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .ToArray();

        return values.Length == 0 ? fallback : values;
    }

    private static int OptionalPositiveInt(string key, int fallback)
    {
        var value = Optional(key);
        if (value == null)
        {
            return fallback;
        }

        if (int.TryParse(value, out var parsed) && parsed > 0)
        {
            return parsed;
        }

        throw new InvalidOperationException($"{key} must be a positive integer.");
    }

    private static string? OptionalConfiguration(IConfiguration configuration, string key)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static int OptionalConfigurationPositiveInt(IConfiguration configuration, string key, int fallback)
    {
        var value = OptionalConfiguration(configuration, key);
        if (value == null)
        {
            return fallback;
        }

        if (int.TryParse(value, out var parsed) && parsed > 0)
        {
            return parsed;
        }

        throw new InvalidOperationException($"{key} must be a positive integer.");
    }

    private static int OptionalNonNegativeInt(string key, int fallback)
    {
        var value = Optional(key);
        if (value == null)
        {
            return fallback;
        }

        if (int.TryParse(value, out var parsed) && parsed >= 0)
        {
            return parsed;
        }

        throw new InvalidOperationException($"{key} must be a non-negative integer.");
    }

    private static int DefaultRabbitMqPort(string scheme)
    {
        return scheme.Equals("amqps", StringComparison.OrdinalIgnoreCase) ? 5671 : 5672;
    }

    private static string RabbitMqVirtualHost(Uri uri)
    {
        var path = uri.AbsolutePath.Trim('/');
        return string.IsNullOrWhiteSpace(path)
            ? "/"
            : Uri.UnescapeDataString(path);
    }

    private static string KeycloakRealmName(string authority)
    {
        var uri = new Uri(authority);
        var pathParts = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var realmsIndex = Array.FindIndex(pathParts, part => part.Equals("realms", StringComparison.OrdinalIgnoreCase));
        if (realmsIndex >= 0 && realmsIndex + 1 < pathParts.Length)
        {
            return pathParts[realmsIndex + 1];
        }

        if (pathParts.Length > 0)
        {
            return pathParts[^1];
        }

        throw new InvalidOperationException("KEYCLOAK_AUTHORITY must include the realm path, for example https://host/realms/app-service.");
    }

    private static string Required(string? value, string description, string key)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        throw new InvalidOperationException($"Missing required configuration: {description}. Set {key}.");
    }
}
