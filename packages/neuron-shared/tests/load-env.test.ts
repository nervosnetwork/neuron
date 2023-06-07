import fs from 'fs'
import { loadEnv } from "../src/load-env"


jest.mock('fs')

const contentMap: Record<string, string> = {
  '.env': 'TEST_ENV="from .env"',
  '.env.test': 'TEST_ENV="from .env.test"',
  '.env.test.local': 'TEST_ENV="from .env.test.local"',
}

describe("Load Env", () => {
  beforeAll(() => {
    fs.readFileSync = jest.fn().mockImplementation(
      (filepath: string) => contentMap[filepath] || ''
    )
  })
  afterAll(() => {
    jest.resetAllMocks()
  })
  describe("read one by one", () => {
    it(".env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_ENV).toEqual('from .env')
    })
    it(".env.test > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.test', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_ENV).toEqual('from .env.test')
    })
    it(".env.test.local > .env.test > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.test.local', '.env.test', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_ENV).toEqual('from .env.test.local')
    })
    it("does not throw error when .env not exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !['.env.test.local', '.env.test', '.env'].includes(filepath)
      })
      expect(() => loadEnv()).not.toThrow()
    })
  })
})
