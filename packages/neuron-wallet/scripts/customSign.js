const { execSync } = require('node:child_process')
const path = require('node:path')

/**
 * Windows code signing with SSL.com eSigner CodeSignTool.
 *
 * Required environment variables:
 *   SSL_COM_USERNAME      - SSL.com account username
 *   SSL_COM_PASSWORD      - SSL.com account password
 *   SSL_COM_TOTP_SECRET   - eSigner TOTP secret (OAuth secret)
 *   SSL_COM_MODE          - "sandbox" or "product". Defaults to "product".
 *   SSL_COM_CREDENTIAL_ID - optional, only needed when the account has multiple certificates
 *   CODE_SIGN_TOOL_PATH   - directory where CodeSignTool is extracted, e.g. C:\\CodeSignTool
 *
 * When the credentials are absent the signing is skipped instead of failing, so that
 * unsigned test builds (see .github/workflows/package_for_test.yml) still work.
 * The release workflow asserts the credentials exist before packaging, so a release
 * build can never be silently left unsigned.
 */
exports.default = async configuration => {
  const {
    SSL_COM_USERNAME,
    SSL_COM_PASSWORD,
    SSL_COM_TOTP_SECRET,
    SSL_COM_CREDENTIAL_ID,
    SSL_COM_MODE,
    CODE_SIGN_TOOL_PATH,
  } = process.env

  if (!SSL_COM_USERNAME || !SSL_COM_PASSWORD || !SSL_COM_TOTP_SECRET) {
    console.info('Skip signing because SSL.com credentials are not configured')
    return
  }

  if (!configuration.path) {
    throw new Error(`Path of application is not found`)
  }

  const toolDir = CODE_SIGN_TOOL_PATH || 'C:\\CodeSignTool'
  const toolCmd = path.join(toolDir, 'CodeSignTool.bat')
  const inputPath = path.resolve(String(configuration.path))

  const args = [
    'sign',
    `-username="${SSL_COM_USERNAME}"`,
    `-password="${SSL_COM_PASSWORD}"`,
    `-totp_secret="${SSL_COM_TOTP_SECRET}"`,
    `-input_file_path="${inputPath}"`,
    '-override=true',
  ]

  if (SSL_COM_CREDENTIAL_ID) {
    args.push(`-credential_id="${SSL_COM_CREDENTIAL_ID}"`)
  }

  console.info(`Signing ${inputPath} with SSL.com CodeSignTool`)

  execSync(`"${toolCmd}" ${args.join(' ')}`, {
    cwd: toolDir,
    stdio: 'inherit',
    env: { ...process.env, MODE: SSL_COM_MODE || 'product' },
  })
}
