const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return
  }

  if (process.env.SKIP_NOTARIZE === 'true') {
    console.warn('Skip notarizing when apple id is empty')
    return Promise.resolve('skip')
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;

  if (!appleId || !appleIdPassword) {
    console.warn(`${appleId ? "Apple id password" : "Apple id"} is not found`)
    process.exit(1)
  }

  const appName = context.packager.appInfo.productFilename

  console.info("Notarization started")

  try {
    await notarize({
      appBundleId: 'com.nervos.neuron',
      appPath: `${appOutDir}/${appName}.app`,
      appleId: appleId,
      appleIdPassword: appleIdPassword,
    })
    console.info("Notarization finished")
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
