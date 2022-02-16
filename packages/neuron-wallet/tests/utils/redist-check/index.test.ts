import redistCheck from '../../../src/utils/redist-check';

let originalPlatform: string;

type ExecPromiseResult = Promise<{ stdout?: null | string; stderr?: null | string }>;
type ExecFunc = () => ExecPromiseResult;
jest.mock('util', () => ({
  promisify: jest
    .fn<ExecFunc, any>(() => () => Promise.resolve({ stdout: 'success' }))
    .mockImplementationOnce(() => () => Promise.resolve({ stdout: 'success' }))
    .mockImplementationOnce(() => () => Promise.resolve({ stdout: null, stderr: 'err' }))
    .mockImplementationOnce(() => () => Promise.reject({ stdout: null, stderr: 'err' })),
}));
jest.mock('utils/logger', () => console);

describe('redist check', () => {
  describe('win32', () => {
    beforeAll(function(){
      originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {  
        value: 'win32'
      });
    });
    it('true', async () => {
      const redistStatus = await redistCheck()
      expect(redistStatus).toBe(true)
    })
    it('false', async () => {
      const redistStatus = await redistCheck()
      expect(redistStatus).toBe(false)
    })
    it('false with reject', async () => {
      const redistStatus = await redistCheck()
      expect(redistStatus).toBe(false)
    })
    afterAll(function(){
      Object.defineProperty(process, 'platform', {  
        value: originalPlatform
      });
   });
  })
  describe('not win32', () => {
    beforeAll(function(){
      originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {  
        value: 'darwin'
      });
    });
    it('true', async () => {
      const redistStatus = await redistCheck()
      expect(redistStatus).toBe(true)
    })
    afterAll(function(){
      Object.defineProperty(process, 'platform', {  
        value: originalPlatform
      });
   });
  })
})
