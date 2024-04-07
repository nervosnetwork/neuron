import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./__tests__",
  maxFailures: 2,
};

export default config;
