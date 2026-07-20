import Constants from 'expo-constants';

/**
 * Runtime configuration, read from app.json `expo.extra` (via expo-constants)
 * with safe fallbacks. Nothing here is hard-coded into feature code — the
 * Keycloak client id in particular can be finalized in app config without a
 * code change once the realm's public mobile client is provisioned.
 */
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
  /** Public web app origin used to build shareable wheel links (app.<domain>/w/<id>). */
  webAppBaseUrl: extra.webAppBaseUrl ?? 'https://app.alaasmagi.dev',
  keycloak: {
    /** OIDC issuer / realm URL; discovery is derived from this. */
    issuer,
    /** Public client with PKCE (S256) required — see design.md prerequisite. */
    clientId: extra.keycloakClientId ?? 'food-app-mobile',
    /** Custom scheme registered for the OAuth redirect. */
    redirectScheme: extra.redirectScheme ?? 'foodroulette',
    /** offline_access requests a refresh token; profile/email are standard. */
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    /** Stable Keycloak token endpoint, used directly by the refresh path. */
    tokenEndpoint: `${issuer}/protocol/openid-connect/token`,
  },
} as const;
