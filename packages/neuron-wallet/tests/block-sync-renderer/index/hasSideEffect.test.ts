describe(`Should subscribe to 2 subjects on importing`, () => {
  const stubbedAddressCreatedSubjectSubscribe = jest.fn()
  const stubbedWalletDeletedSubjectSubscribe = jest.fn()
  jest.doMock('models/subjects/address-created-subject', () => ({
    getSubject: () => ({ subscribe: stubbedAddressCreatedSubjectSubscribe }),
  }))
  jest.doMock('models/subjects/wallet-deleted-subject', () => ({
    getSubject: () => ({ subscribe: stubbedWalletDeletedSubjectSubscribe }),
  }))

  require('block-sync-renderer')

  it('subscribe to #AddressCreatedSubject and #WalletDeletedSubject', () => {
    expect(stubbedAddressCreatedSubjectSubscribe).toHaveBeenCalled()
    expect(stubbedWalletDeletedSubjectSubscribe).toHaveBeenCalled()
  })
})
