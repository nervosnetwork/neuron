import { app } from 'electron'

const env = {
  isDevMode: !app.isPackaged,
}

export default env
