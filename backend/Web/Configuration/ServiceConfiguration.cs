using System.Text.Json;
using Application;
using Base.Cache;
using Base.Contracts.DataAccess;
using Base.Contracts.DTO;
using Base.Contracts.Cache;
using Base.Contracts.Message;
using Base.Keycloak.Authentication;
using Base.Message.RabbitMQ;
using Contracts.Application;
using Contracts.DataAccess;
using Contracts.External;
using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;
using DTO.Web;
using DTO.Web.Mappers;
using External.Cache;
using External.Offers;
using External.RabbitMQ;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace Web.Configuration;

public static class ServiceConfiguration
{
    public static void ConfigureApplicationServices(this WebApplicationBuilder builder)
    {
        var keycloakOptions = RequiredConfiguration.KeycloakOptions();
        var rabbitMqOptions = RequiredConfiguration.RabbitMqOptions();
        var appMessagingOptions = RequiredConfiguration.AppMessagingOptions(keycloakOptions);
        var redisConnectionString = RequiredConfiguration.RedisConnectionString();
        var baseCacheOptions = RequiredConfiguration.BaseCacheOptions();
        var offerCacheConnectionString = RequiredConfiguration.OfferCacheConnectionString(builder.Configuration);
        var offerCacheOptions = RequiredConfiguration.OfferCacheOptions(builder.Configuration);
        var recommendationScheduleOptions = RequiredConfiguration.DailyRecommendationScheduleOptions();
        var recommendationNotificationOptions = RequiredConfiguration.DailyRecommendationNotificationOptions();
        var frontendOriginProvider = new FrontendOriginProvider(RequiredConfiguration.FrontendOrigin());

        builder.ConfigureApplicationLogging();
        builder.ConfigureGlitchtip();

        builder.Services
            .AddDataAccess(offerCacheConnectionString)
            .AddApplicationServices(offerCacheOptions)
            .AddApplicationAuthentication(keycloakOptions)
            .AddApplicationCors(frontendOriginProvider)
            .AddApplicationCache(redisConnectionString, baseCacheOptions)
            .AddApplicationMessaging(rabbitMqOptions, appMessagingOptions)
            .AddDailyRecommendationNotifications(recommendationScheduleOptions, recommendationNotificationOptions)
            .AddApplicationMvc();

        builder.Services.ConfigureForwardedHeaders();
    }

    private static IServiceCollection AddApplicationCache(
        this IServiceCollection services,
        string redisConnectionString,
        BaseCacheOptions baseCacheOptions)
    {
        services.AddSingleton(baseCacheOptions);
        services.AddSingleton<IBaseCacheSerializer, BaseJsonCacheSerializer>();
        services.AddSingleton<IBaseCacheKeyBuilder, BaseCacheKeyBuilder>();
        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(redisConnectionString));
        services.AddSingleton<IAppCache, RedisCache>();
        services.AddSingleton<IBaseCache>(provider => provider.GetRequiredService<IAppCache>());

        return services;
    }

    private static IServiceCollection AddDataAccess(this IServiceCollection services, string offerCacheConnectionString)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(RequiredConfiguration.AppConnectionString()));
        services.AddDbContext<OfferCacheDbContext>(options =>
            options.UseSqlite(offerCacheConnectionString, sqlite =>
                sqlite.MigrationsHistoryTable("__OfferCacheMigrationsHistory")));
        services.AddScoped<DbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddDatabaseDeveloperPageExceptionFilter();

        services.AddScoped<IMapper<AppUser, AppUserEntity>, AppUserEntityMapper>();
        services.AddScoped<IMapper<AppUser, AppUser>, AppUserIdentityMapper>();
        services.AddScoped<IMapper<AppUserDto, AppUser>, AppUserDtoMapper>();
        services.AddScoped<IMapper<OfferProvider, OfferProviderEntity>, OfferProviderEntityMapper>();
        services.AddScoped<IMapper<OfferProvider, OfferProvider>, OfferProviderIdentityMapper>();
        services.AddScoped<IMapper<OfferProviderDto, OfferProvider>, OfferProviderDtoMapper>();
        services.AddScoped<IMapper<Restaurant, RestaurantEntity>, RestaurantEntityMapper>();
        services.AddScoped<IMapper<Restaurant, Restaurant>, RestaurantIdentityMapper>();
        services.AddScoped<IMapper<RestaurantDto, Restaurant>, RestaurantDtoMapper>();
        services.AddScoped<IMapper<DiningEnvironment, DiningEnvironmentEntity>, DiningEnvironmentEntityMapper>();
        services.AddScoped<IMapper<DiningEnvironment, DiningEnvironment>, DiningEnvironmentIdentityMapper>();
        services.AddScoped<IMapper<DiningEnvironmentDto, DiningEnvironment>, DiningEnvironmentDtoMapper>();
        services.AddScoped<IMapper<EnvironmentRestaurant, EnvironmentRestaurantEntity>, EnvironmentRestaurantEntityMapper>();
        services.AddScoped<IMapper<EnvironmentRestaurant, EnvironmentRestaurant>, EnvironmentRestaurantIdentityMapper>();
        services.AddScoped<IMapper<EnvironmentRestaurantDto, EnvironmentRestaurant>, EnvironmentRestaurantDtoMapper>();
        services.AddScoped<IMapper<Favourite, FavouriteEntity>, FavouriteEntityMapper>();
        services.AddScoped<IMapper<Favourite, Favourite>, FavouriteIdentityMapper>();
        services.AddScoped<IMapper<FavouriteDto, Favourite>, FavouriteDtoMapper>();
        services.AddScoped<IMapper<UserWheel, UserWheelEntity>, UserWheelEntityMapper>();
        services.AddScoped<IMapper<UserWheel, UserWheel>, UserWheelIdentityMapper>();
        services.AddScoped<IMapper<UserWheelDto, UserWheel>, UserWheelDtoMapper>();

        services.AddScoped<IAppUserRepository, AppUserRepository>();
        services.AddScoped<IOfferProviderRepository, OfferProviderRepository>();
        services.AddScoped<IOfferCacheRepository, OfferCacheRepository>();
        services.AddScoped<IRestaurantRepository, RestaurantRepository>();
        services.AddScoped<IDiningEnvironmentRepository, DiningEnvironmentRepository>();
        services.AddScoped<IEnvironmentRestaurantRepository, EnvironmentRestaurantRepository>();
        services.AddScoped<IFavouriteRepository, FavouriteRepository>();
        services.AddScoped<IUserWheelRepository, UserWheelRepository>();
        services.AddScoped<IBaseUow, DataAccessUow>();

        return services;
    }

    private static IServiceCollection AddApplicationServices(this IServiceCollection services, OfferCacheOptions offerCacheOptions)
    {
        services.AddSingleton(offerCacheOptions);
        services.AddScoped<IAppUserService, AppUserService>();
        services.AddScoped<IOfferFetchService, OfferFetchService>();
        services.AddScoped<IOfferProviderService, OfferProviderService>();
        services.AddScoped<IRestaurantService, RestaurantService>();
        services.AddScoped<IDiningEnvironmentService, DiningEnvironmentService>();
        services.AddScoped<IEnvironmentRestaurantService, EnvironmentRestaurantService>();
        services.AddScoped<IFavouriteService, FavouriteService>();
        services.AddScoped<IUserWheelService, UserWheelService>();
        services.AddScoped<ICurrentActorAccessor, CurrentActorAccessor>();
        services.AddHttpClient<HtmlOfferProviderFetcher>();
        services.AddHttpClient<ApiOfferProviderFetcher>();
        services.AddScoped<IOfferProviderFetcher>(provider => provider.GetRequiredService<HtmlOfferProviderFetcher>());
        services.AddScoped<IOfferProviderFetcher>(provider => provider.GetRequiredService<ApiOfferProviderFetcher>());
        services.AddScoped<IOfferProviderFetcherResolver, OfferProviderFetcherResolver>();

        return services;
    }

    private static IServiceCollection AddApplicationAuthentication(
        this IServiceCollection services,
        KeycloakOptions keycloakOptions)
    {
        services.AddHttpContextAccessor();
        // OIDC cookie stays the default scheme (MVC admin console + login front-door); the JWT bearer
        // scheme authorizes the Web API surface the Vue frontend calls with a token.
        services.AddKeycloakOidc(keycloakOptions);
        services.AddKeycloakJwtBearer(keycloakOptions);

        // AddKeycloakJwtBearer registers via AddAuthentication("Bearer"), which sets DefaultScheme =
        // Bearer and (running after AddKeycloakOidc) overwrites the cookie default. That leaves the
        // OIDC callback's sign-in resolving to the JWT handler, which cannot SignInAsync. Pin the
        // schemes back explicitly so the fix does not depend on registration order.
        services.Configure<AuthenticationOptions>(options =>
        {
            options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.Admin, policy =>
            {
                policy.RequireAuthenticatedUser();
                policy.RequireRole(AuthorizationPolicies.AdminRealmRole);
            });

            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });

        return services;
    }

    private static IServiceCollection AddApplicationCors(
        this IServiceCollection services,
        FrontendOriginProvider frontendOriginProvider)
    {
        // One source of the allowed frontend origin: the same provider validates login/logout return
        // urls (injected into the MVC AccountController), so CORS and redirect validation cannot drift.
        services.AddSingleton(frontendOriginProvider);
        services.AddCors(options =>
        {
            // Credentialed and origin-specific (never a wildcard, which credentialed CORS forbids).
            options.AddPolicy(CorsPolicies.Frontend, policy => policy
                .WithOrigins(frontendOriginProvider.Origin)
                .AllowCredentials()
                .AllowAnyHeader()
                .AllowAnyMethod());
        });

        return services;
    }

    private static IServiceCollection AddApplicationMessaging(
        this IServiceCollection services,
        RabbitMqOptions rabbitMqOptions,
        AppMessagingOptions appMessagingOptions)
    {
        services.Configure<HostOptions>(options =>
        {
            options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
        });

        services.AddSingleton(appMessagingOptions);
        services.AddRabbitMqPublisher(rabbitMqOptions);
        services.AddSingleton<IAppEventPublisher, External.RabbitMQ.RabbitMqEventPublisher>();
        services.AddSingleton<IBaseEventHandler<JsonElement>, RabbitMqEventHandler>();
        services.AddRabbitMqConsumer<RabbitMqEventConsumer>();

        return services;
    }

    private static IServiceCollection AddDailyRecommendationNotifications(
        this IServiceCollection services,
        DailyRecommendationScheduleOptions scheduleOptions,
        DailyRecommendationNotificationOptions notificationOptions)
    {
        services.AddSingleton(scheduleOptions);
        services.AddSingleton(notificationOptions);
        services.AddScoped<IDailyRecommendationNotificationService, DailyRecommendationNotificationService>();
        services.AddHostedService<DailyRecommendationSchedulerHostedService>();

        return services;
    }

    private static IServiceCollection AddApplicationMvc(this IServiceCollection services)
    {
        services.AddControllersWithViews(options =>
            {
                options.ModelMetadataDetailsProviders.Add(new ConcurrencyTokenValidationMetadataProvider());
            })
            .AddRazorOptions(options =>
            {
                options.ViewLocationFormats.Clear();
                options.ViewLocationFormats.Add("/MVC/Views/{1}/{0}.cshtml");
                options.ViewLocationFormats.Add("/MVC/Views/Shared/{0}.cshtml");

                // {2} = area, {1} = controller, {0} = action. Admin console views live under
                // /MVC/Areas/{area}/Views/... and fall back to the shared MVC views for layout/partials.
                options.AreaViewLocationFormats.Clear();
                options.AreaViewLocationFormats.Add("/MVC/Areas/{2}/Views/{1}/{0}.cshtml");
                options.AreaViewLocationFormats.Add("/MVC/Areas/{2}/Views/Shared/{0}.cshtml");
                options.AreaViewLocationFormats.Add("/MVC/Views/Shared/{0}.cshtml");
            });

        return services;
    }

    private static void ConfigureForwardedHeaders(this IServiceCollection services)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders =
                ForwardedHeaders.XForwardedFor |
                ForwardedHeaders.XForwardedProto |
                ForwardedHeaders.XForwardedHost;

            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }
}
