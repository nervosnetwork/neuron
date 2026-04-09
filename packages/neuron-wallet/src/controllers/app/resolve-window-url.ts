import env from '../../env'

export const resolveInternalWindowTarget = (url: string) => {
  const normalizedUrl = url.trim()

  if (normalizedUrl.startsWith('#/')) {
    return {
      navigationUrl: normalizedUrl.replace(/^#/, ''),
      windowUrl: `${env.mainURL}${normalizedUrl}`,
    }
  }

  if (normalizedUrl.startsWith('/')) {
    return {
      navigationUrl: normalizedUrl,
      windowUrl: `${env.mainURL}#${normalizedUrl}`,
    }
  }

  return null
}
