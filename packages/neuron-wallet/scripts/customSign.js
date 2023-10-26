const { execSync } = require('node:child_process')

exports.default = async configuration => {
  if (!configuration.path) {
    throw new Error(`Path of application is not found`)
  }

  execSync(`smctl sign --keypair-alias="${process.env.SM_KEYPAIR_NAME}" --input "${String(configuration.path)}"`, {
    stdio: 'inherit',
  })
}
