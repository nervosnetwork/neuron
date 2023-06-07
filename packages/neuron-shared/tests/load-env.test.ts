import fs from 'fs'
import { loadEnv } from "../src/load-env"


jest.mock('fs')

const contentMap: Record<string, string> = {
  '.env': 'TEST_VAR="from .env"',
  '.env.test': 'TEST_VAR="from .env.test"',
  '.env.test.local': 'TEST_VAR="from .env.test.local"',
  '.env.development': 'TEST_VAR="from .env.development"',
  '.env.development.local': 'TEST_VAR="from .env.development.local"',
  '.env.production': 'TEST_VAR="from .env.production"',
  '.env.production.local': 'TEST_VAR="from .env.production.local"',
}

describe("Load Env", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    fs.readFileSync = jest.fn().mockImplementation(
      (filepath: string) => contentMap[filepath] || ''
    )
  })
  afterAll(() => {
    jest.restoreAllMocks()
  })
  afterEach(() => {
    process.env = originalEnv;
  })
  describe("in test environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test'
      delete process.env.TEST_VAR
    })
    it(".env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env')
    })
    it(".env.test > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.test', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.test')
    })
    it(".env.test.local > .env.test > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.test.local', '.env.test', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.test.local')
    })
    it("does not throw error when no env file exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !(['.env.test.local', '.env.test', '.env'].includes(filepath))
      })
      expect(process.env.TEST_VAR).toBeUndefined()
      expect(() => loadEnv()).not.toThrow()
    })
  })
  describe("in development environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
      delete process.env.TEST_VAR
    })
    it(".env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env')
    })
    it(".env.development > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.development', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.development')
    })
    it(".env.development.local > .env.development > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.development.local', '.env.development', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.development.local')
    })
    it("does not throw error when no env file exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !(['.env.development.local', '.env.development', '.env'].includes(filepath))
      })
      expect(process.env.TEST_VAR).toBeUndefined()
      expect(() => loadEnv()).not.toThrow()
    })
  })

  describe("in production environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
      delete process.env.TEST_VAR
    })
    it(".env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env')
    })
    it(".env.production > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.production', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.production')
    })
    it(".env.production.local > .env.production > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.production.local', '.env.production', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.production.local')
    })
    it("does not throw error when no env file exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !(['.env.production.local', '.env.production', '.env'].includes(filepath))
      })
      expect(process.env.TEST_VAR).toBeUndefined()
      expect(() => loadEnv()).not.toThrow()
    })
  })
})
