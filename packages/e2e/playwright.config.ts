import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./__tests__/tests/",
  maxFailures: 2,
  timeout: 60000,
  retries: 1
};

export default config;
