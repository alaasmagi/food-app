namespace DTO.Messaging;

// Local food-app messaging constants following the naming convention of Base.Message
// DefaultMessageActions / DefaultMessageTypes. These are intentionally not reused from the
// Keycloak identity contract because the daily lunch recommendation is food-sourced.

public static class AppMessageTypes
{
    public const string Email = "email";
    public const string Food = "food";
}

public static class AppMessageSources
{
    public const string Food = "food";
}

public static class AppMessageActions
{
    public const string DailyLunchRecommendation = "daily.lunch.recommendation";
}
