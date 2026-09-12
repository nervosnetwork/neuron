jest.mock('node:child_process', () => ({ execFileSync: jest.fn(), execSync: jest.fn() }))

const path = require('node:path')
const { execFileSync, execSync } = require('node:child_process')
const sign = require('../../scripts/customSign').default

const originalEnv = process.env
const credentials = {
  SSL_COM_USERNAME: 'signer@example.test',
  SSL_COM_PASSWORD: 'before%USERNAME%after" & | ^ ! \\ end',
  SSL_COM_TOTP_SECRET: 'test-totp',
  SSL_COM_CREDENTIAL_ID: 'test-certificate',
  CODE_SIGN_TOOL_PATH: path.resolve('tool directory'),
}

beforeEach(() => {
  process.env = { ...credentials }
  jest.clearAllMocks()
  jest.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
  process.env = originalEnv
  jest.restoreAllMocks()
})

test('passes credentials and paths literally without a shell', async () => {
  const inputPath = path.resolve('build directory', 'Neuron.exe')
  await sign({ path: inputPath })
  expect(execSync).not.toHaveBeenCalled()
  expect(execFileSync).toHaveBeenCalledWith(
    path.join(credentials.CODE_SIGN_TOOL_PATH, 'jdk-11.0.2', 'bin', 'java.exe'),
    [
      '-jar',
      path.join(credentials.CODE_SIGN_TOOL_PATH, 'jar', 'code_sign_tool-1.3.2.jar'),
      'sign',
      `-username=${credentials.SSL_COM_USERNAME}`,
      `-password=${credentials.SSL_COM_PASSWORD}`,
      `-totp_secret=${credentials.SSL_COM_TOTP_SECRET}`,
      `-input_file_path=${inputPath}`,
      '-override=true',
      `-credential_id=${credentials.SSL_COM_CREDENTIAL_ID}`,
    ],
    { cwd: credentials.CODE_SIGN_TOOL_PATH, stdio: 'inherit', shell: false }
  )
})

test.each(['SSL_COM_USERNAME', 'SSL_COM_PASSWORD', 'SSL_COM_TOTP_SECRET'])(
  'skips unsigned test builds when %s is missing',
  async key => {
    delete process.env[key]
    await sign({ path: 'Neuron.exe' })
    expect(execFileSync).not.toHaveBeenCalled()
    expect(execSync).not.toHaveBeenCalled()
  }
)

test('allows accounts with only one certificate', async () => {
  delete process.env.SSL_COM_CREDENTIAL_ID
  await sign({ path: 'Neuron.exe' })
  expect(execFileSync.mock.calls[0][1].some(arg => arg.startsWith('-credential_id='))).toBe(false)
})

test('rejects a missing application path', async () => {
  await expect(sign({})).rejects.toThrow('Path of application is not found')
  expect(execFileSync).not.toHaveBeenCalled()
})

test('propagates signing failures to electron-builder', async () => {
  execFileSync.mockImplementationOnce(() => {
    throw new Error('signing failed')
  })
  await expect(sign({ path: 'Neuron.exe' })).rejects.toThrow('signing failed')
})
