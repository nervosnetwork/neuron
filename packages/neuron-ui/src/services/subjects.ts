export const systemScript = () => {
  if (!window.remote) {
    console.warn('remote is not supported')
    return undefined
  }
  return window.remote.require('./models/subjects/system-script').default
}

export default {
  systemScript,
}
