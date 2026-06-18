# Neuron Playwright E2E

This directory contains the release-regression E2E harness for the Electron wallet.

## Run

```bash
yarn install
yarn test:e2e
```

Useful variants:

```bash
yarn test:e2e:headed
yarn test:e2e:ui
```

The root Playwright config starts the Vite UI server on `http://127.0.0.1:3000`. The fixture then launches the Electron main process from `packages/neuron-wallet` after `yarn build:main` has compiled it.

## CI and Release Machines

These tests are intended to run on developer machines and on CI/release workers that provide a graphical session. On Linux CI, run them under Xvfb:

```bash
xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" yarn test:e2e
```

The test config is CI-aware: it uses one worker, enables retries when `CI=true`, keeps reports closed in non-interactive runs, and stores traces, screenshots, and videos in Playwright output directories. A plain headless Node environment without a GUI session or Xvfb is not enough because Playwright launches the Electron app window.

GitHub Actions runs this through `.github/workflows/e2e.yml`. When a run fails, download the `playwright-report` and `playwright-test-results` artifacts from the workflow run. The HTML report shows the failed step, and `test-results/e2e` contains retained screenshots, videos, and Playwright trace files that can be replayed with Playwright trace viewer.

## Test Data

Each test run isolates Electron user data through `XDG_CONFIG_HOME` under the Playwright test output directory. Keep tests independent and avoid relying on a developer's local Neuron profile.

For cases that need wallet, chain, or RPC state, prefer explicit setup helpers in `e2e/fixtures` over manually prepared local data. This keeps release regression repeatable in CI.

## Selector Guidance

Prefer stable user-facing locators (`getByRole`, `getByText`, labels) when the UI exposes them. If a flow needs precision that current markup cannot support, add explicit `data-testid` attributes near the component being tested instead of depending on generated class names or translated copy.
