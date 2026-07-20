import { config } from '@/config/env';

/** Confirms the Jest harness runs and module aliases resolve. */
describe('test harness', () => {
  it('runs and resolves config', () => {
    expect(config.keycloak.issuer).toContain('/realms/food-app');
    expect(config.apiBaseUrl).toMatch(/^https:\/\//);
  });
});
