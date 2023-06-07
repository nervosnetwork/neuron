import { loadEnv } from "../src/load-env"
import fs from 'node:fs'


jest.mock('node:fs')
describe("Load Env", () => {
  beforeAll(() => {
    fs.readFileSync = jest.fn().mockImplementation((filepath) => {
      if (filepath === '.env.test.local') {
        return 'TEST_ENV="from .env.test.local"'
      } else if (filepath === '.env.test') {
        return 'TEST_ENV="from .env.test"'
      } else if (filepath === '.env') {
        return 'TEST_ENV="from .env"'
      } else {
        return ''
      }
    })
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
  })
})
