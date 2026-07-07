const mockExecPromise = jest.fn()

jest.mock('util', () => ({
  promisify: jest.fn(() => mockExecPromise),
}))
jest.mock('utils/logger', () => console)

import redistCheck, {
  compareVersions,
  getRedistVersion,
  isSupportedRedist,
  MINIMUM_REDIST_VERSION,
} from '../../../src/utils/redist-check'

let originalPlatform: string

const setPlatform = (platform: string) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
  })
}

const registryOutput = (version: string, installed = '0x1') => `
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64
    Installed    REG_DWORD    ${installed}
    Version      REG_SZ       v${version}
`

describe('redist check', () => {
  beforeAll(() => {
    originalPlatform = process.platform
  })

  afterAll(() => {
    setPlatform(originalPlatform)
  })

  beforeEach(() => {
    mockExecPromise.mockReset()
  })

  describe('version helpers', () => {
    it('parses the redist version from registry output', () => {
      expect(getRedistVersion(registryOutput('14.44.35208.0'))).toBe('14.44.35208.0')
    })

    it('compares version parts numerically', () => {
      expect(compareVersions('14.44.0.0', MINIMUM_REDIST_VERSION)).toBe(0)
      expect(compareVersions('14.44.1.0', MINIMUM_REDIST_VERSION)).toBe(1)
      expect(compareVersions('14.29.30133.0', MINIMUM_REDIST_VERSION)).toBe(-1)
    })

    it('requires an installed runtime at or above the minimum version', () => {
      expect(isSupportedRedist(registryOutput('14.44.0.0'))).toBe(true)
      expect(isSupportedRedist(registryOutput('14.29.30133.0'))).toBe(false)
      expect(isSupportedRedist(registryOutput('14.44.0.0', '0x0'))).toBe(false)
      expect(isSupportedRedist('success')).toBe(false)
    })
  })

  describe('win32', () => {
    beforeEach(() => {
      setPlatform('win32')
    })

    it('returns true when the x64 runtime is new enough', async () => {
      mockExecPromise.mockResolvedValue({ stdout: registryOutput('14.44.0.0') })

      const redistStatus = await redistCheck()

      expect(redistStatus).toBe(true)
      expect(mockExecPromise).toHaveBeenCalledWith(expect.stringContaining('VisualStudio'))
      expect(mockExecPromise).toHaveBeenCalledWith(expect.stringContaining('Runtimes'))
      expect(mockExecPromise).toHaveBeenCalledWith(expect.stringContaining('x64'))
    })

    it('returns false when the x64 runtime is too old', async () => {
      mockExecPromise.mockResolvedValue({ stdout: registryOutput('14.29.30133.0') })

      const redistStatus = await redistCheck()

      expect(redistStatus).toBe(false)
    })

    it('returns false when the query does not include a version', async () => {
      mockExecPromise.mockResolvedValue({ stdout: 'success' })

      const redistStatus = await redistCheck()

      expect(redistStatus).toBe(false)
    })

    it('returns false when the query writes to stderr', async () => {
      mockExecPromise.mockResolvedValue({ stdout: null, stderr: 'err' })

      const redistStatus = await redistCheck()

      expect(redistStatus).toBe(false)
    })

    it('returns false when the query rejects', async () => {
      mockExecPromise.mockRejectedValue({ stdout: null, stderr: 'err' })

      const redistStatus = await redistCheck()

      expect(redistStatus).toBe(false)
    })
  })

  describe('not win32', () => {
    beforeEach(() => {
      setPlatform('darwin')
    })

    it('returns true without querying the registry', async () => {
      const redistStatus = await redistCheck()

      expect(redistStatus).toBe(true)
      expect(mockExecPromise).not.toHaveBeenCalled()
    })
  })
})
