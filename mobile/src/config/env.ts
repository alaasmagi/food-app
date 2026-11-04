import Constants from 'expo-constants';

/** Runtime configuration from app.json `expo.extra`, with fallbacks. */
type Extra = {
  keycloakIssuer?: string;
  keycloakClientId?: string;
  redirectScheme?: string;
  apiBaseUrl?: string;
  webAppBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const issuer = extra.keycloakIssuer ?? 'https://identity.alaasmagi.dev/realms/food-app';

export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? 'https://food-api.alaasmagi.dev',
  webAppBaseUrl: extra.webAppBaseUrl ?? 'https://app.alaasmagi.dev',
  keycloak: {
    issuer,
    clientId: extra.keycloakClientId ?? 'food-app-mobile',
    redirectScheme: extra.redirectScheme ?? 'foodroulette',
    // offline_access requests a refresh token.
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    tokenEndpoint: `${issuer}/protocol/openid-connect/token`,
  },
} as const;
