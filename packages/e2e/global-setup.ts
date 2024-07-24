import { concurrently } from 'concurrently'
import path from 'path'
const waitOn = require('wait-on');

async function globalSetup() {
  const { commands } = concurrently(
    [
      {
        command: 'cross-env BROWSER=none yarn run start:ui',
        name: 'start ui',
        cwd: path.resolve(__dirname, '../../'),
      },
    ],
  );
  await waitOn({
    resources: [
      'http://127.0.0.1:3000'
    ],
    timeout: 30_000,
  })
  console.log('ui start success')
  return async () => {
    console.log('stop ui server')
    await commands[0].kill()
  }
}

export default globalSetup;
