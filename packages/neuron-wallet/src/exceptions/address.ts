import i18n from '../utils/i18n'

export class InvalidAddress extends Error {
  constructor(address: string) {
    super(i18n.t('address-is-invalid', { address }))
  }
}
export default { InvalidAddress }
