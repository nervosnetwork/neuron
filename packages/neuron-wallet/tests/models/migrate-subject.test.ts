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
    MigrateSubject.next({ type: 'need-migrate' })
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toBeCalledTimes(2)
  })

  it('migrate status migrating', async () => {
    MigrateSubject.next({ type: 'migrating' })
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toBeCalledWith({ type: 'migrating' })
    expect(nextMock).toBeCalledTimes(2)
  })

  it('migrate status change', async () => {
    MigrateSubject.next({ type: 'need-migrate' })
    MigrateSubject.next({ type: 'migrating' })
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toHaveBeenLastCalledWith({ type: 'migrating' })
    expect(nextMock).toBeCalledTimes(3)
  })

  it('migrate end with finish', async () => {
    MigrateSubject.next({ type: 'need-migrate' })
    MigrateSubject.next({ type: 'migrating' })
    MigrateSubject.next({ type: 'finish' })
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toHaveBeenLastCalledWith({ type: 'finish' })
    expect(nextMock).toBeCalledTimes(3)
  })

  it('migrate end with failed', async () => {
    MigrateSubject.next({ type: 'need-migrate' })
    MigrateSubject.next({ type: 'migrating' })
    MigrateSubject.next({ type: 'failed', reason: 'failed'})
    await CommonUtils.sleep(3000)
    MigrateSubject.getSubject().unsubscribe()
    expect(nextMock).toHaveBeenLastCalledWith({ type: 'failed', reason: 'failed'})
    expect(nextMock).toBeCalledTimes(3)
  })
})