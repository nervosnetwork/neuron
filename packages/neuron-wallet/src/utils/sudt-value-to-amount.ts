const sudtValueToAmount = (value: string | null | undefined = '0', decimal: string | null | undefined = '') => {
  if (value === null || value === '0') {
    return '+0'
  }

  if (decimal === null || decimal === undefined || Number.isNaN(+value)) {
    return '--'
  }

  let sign = '+'
  if (value.startsWith('-')) {
    sign = '-'
  }

  const unsignedValue = value.replace(/^-?0*/, '')

  const dec = +decimal
  if (dec === 0) {
    return +unsignedValue ? `${sign}${unsignedValue}` : '+0'
  }
  let unsignedSUDTValue = ''
  if (unsignedValue.length <= dec) {
    unsignedSUDTValue = `0.${unsignedValue.padStart(dec, '0')}`.replace(/\.?0+$/, '')
  } else {
    const decimalFraction = `.${unsignedValue.slice(-dec)}`.replace(/\.?0+$/, '')
    const int = unsignedValue.slice(0, -dec).replace(/\^0+/, '')
    unsignedSUDTValue = `${int}${decimalFraction}`
  }
  return `${sign}${unsignedSUDTValue}`
}

export default sudtValueToAmount
