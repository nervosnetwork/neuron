import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./__tests__/tests/",
  maxFailures: 2,
  timeout: 800000,
  retries: 1,
  globalSetup: require.resolve('./global-setup'),
};

export default config;