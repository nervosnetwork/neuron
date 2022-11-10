import CommonUtils from '../../src/utils/common'

const nextMock = jest.fn()
jest.doMock('rxjs', () => {
  const rxjs = jest.requireActual('rxjs');
  return {
    __esModule: true,
    ...rxjs,
    Subject: function() {
      const res = new rxjs.Subject()
      res.next = nextMock
      return res
    }
  }
});

import MigrateSubject from '../../src/models/subjects/migrate-subject'

describe('migrate subject test', () => {
  beforeEach(() => {
    nextMock.mockReset()
  })

  it('migrate status need-migrate', async () => {
    MigrateSubject.next('need-migrate')
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toBeCalledTimes(2)
  })

  it('migrate status migrating', async () => {
    MigrateSubject.next('migrating')
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toBeCalledWith('migrating')
    expect(nextMock).toBeCalledTimes(2)
  })

  it('migrate status change', async () => {
    MigrateSubject.next('need-migrate')
    MigrateSubject.next('migrating')
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toHaveBeenLastCalledWith('migrating')
    expect(nextMock).toBeCalledTimes(3)
  })

  it('migrate end with finish', async () => {
    MigrateSubject.next('need-migrate')
    MigrateSubject.next('migrating')
    MigrateSubject.next('finish')
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toHaveBeenLastCalledWith('finish')
    expect(nextMock).toBeCalledTimes(3)
  })

  it('migrate end with failed', async () => {
    MigrateSubject.next('need-migrate')
    MigrateSubject.next('migrating')
    MigrateSubject.next('failed')
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toHaveBeenLastCalledWith('failed')
    expect(nextMock).toBeCalledTimes(3)
  })
})