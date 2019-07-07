export enum LocalCacheKey {
  AddressBookVisibility = 'address-book-visibility',
}
enum AddressBookVisibility {
  Invisible = '0',
  Visible = '1',
}

export const addressBook = {
  isVisible: () => {
    const isVisible = window.localStorage.getItem(LocalCacheKey.AddressBookVisibility)
    return AddressBookVisibility.Visible === isVisible
  },

  toggleVisibility: () => {
    window.localStorage.setItem(
      LocalCacheKey.AddressBookVisibility,
      addressBook.isVisible() ? AddressBookVisibility.Invisible : AddressBookVisibility.Visible
    )
  },
}

export default {
  LocalCacheKey,
  addressBook,
}
