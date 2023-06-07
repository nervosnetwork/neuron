import fs from 'fs'
import { loadEnv } from "../src/load-env"


jest.mock('fs')


describe("Load Env", () => {
  const originalEnv = process.env;
  const contentMap: Record<string, string> = {
    '.env': 'TEST_VAR="from .env"',
    '.env.local': 'TEST_VAR="from .env.local"',
    '.env.test': 'TEST_VAR="from .env.test"',
    '.env.test.local': 'TEST_VAR="from .env.test.local"',
    '.env.development': 'TEST_VAR="from .env.development"',
    '.env.development.local': 'TEST_VAR="from .env.development.local"',
    '.env.production': 'TEST_VAR="from .env.production"',
    '.env.production.local': 'TEST_VAR="from .env.production.local"',
  }

  beforeAll(() => {
    fs.readFileSync = jest.fn().mockImplementation(
      (filepath: string) => contentMap[filepath] || ''
    )
  })
  afterAll(() => {
    jest.restoreAllMocks()
  })
  describe("in test environment", () => {
    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.NODE_ENV = 'test'
    })
    afterEach(() => {
      process.env = originalEnv;
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
    it(".env.local is ignored in test env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.local', '.env.test', '.env'].includes(filepath)
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
    it("neither import files nor throw error when no env file exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !(['.env.test.local', '.env.test', '.env'].includes(filepath))
      })
      expect(process.env.TEST_VAR).toBeUndefined()
      expect(() => loadEnv()).not.toThrow()
    })
  })
  describe("in development environment", () => {
    beforeEach(() => {
      process.env = { ...originalEnv }
      process.env.NODE_ENV = 'development'
    })
    afterEach(() => {
      process.env = originalEnv;
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
    it(".env.local > .env.development > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.local', '.env.development', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.local')
    })
    it(".env.development.local > .env.local > .env.development > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.development.local', '.env.local', '.env.development', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.development.local')
    })
    it("neither import files nor throw error when no env file exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !(['.env.development.local', '.env.local', '.env.development', '.env'].includes(filepath))
      })
      expect(process.env.TEST_VAR).toBeUndefined()
      expect(() => loadEnv()).not.toThrow()
    })
  })

  describe("in production environment", () => {
    beforeEach(() => {
      process.env = { ...originalEnv }
      process.env.NODE_ENV = 'production'
    })
    afterEach(() => {
      process.env = originalEnv;
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
    it(".env.local > .env.production > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.local', '.env.production', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.local')
    })
    it(".env.production.local > .env.production > .env", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return ['.env.production.local', '.env.local', '.env.production', '.env'].includes(filepath)
      })
      loadEnv()
      expect(process.env.TEST_VAR).toEqual('from .env.production.local')
    })
    it("neither import files nor throw error when no env file exists", () => {
      fs.existsSync = jest.fn().mockImplementation((filepath) => {
        return !(['.env.production.local', '.env.local', '.env.production', '.env'].includes(filepath))
      })
      expect(process.env.TEST_VAR).toBeUndefined()
      expect(() => loadEnv()).not.toThrow()
    })
  })
})


describe("Merge Env Vars But No Override for process.env", () => {
  const originalEnv = process.env;
  afterAll(() => {
    jest.restoreAllMocks()
  })
  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.NODE_ENV = 'development'
  })
  afterEach(() => {
    process.env = originalEnv;
  })
  it("process.env > .env*", () => {
    const contentMap: Record<string, string> = {
      '.env': 'VAR_1=.env\nVAR_2=.env\nVAR_3=.env\nVAR_4=.env',
      '.env.development': 'VAR_1=.env.development\nVAR_2=.env.development\nVAR_3=.env.development',
      '.env.local': 'VAR1=.env.local\nVAR_2=.env.local',
      '.env.development.local': 'VAR_1=.env.development.local',
    }
    fs.existsSync = jest.fn().mockImplementation((filepath) => {
      return ['.env.development.local', '.env.local', '.env.development', '.env'].includes(filepath)
    })
    fs.readFileSync = jest.fn().mockImplementation(
      (filepath: string) => contentMap[filepath] || ''
    )
    Object.assign(process.env, {
      VAR_5: 'process.env',
    })
    loadEnv()

    expect(process.env.VAR_1).toEqual('.env.development.local')
    expect(process.env.VAR_2).toEqual('.env.local')
    expect(process.env.VAR_3).toEqual('.env.development')
    expect(process.env.VAR_4).toEqual('.env')
    expect(process.env.VAR_5).toEqual('process.env')
  })
})
