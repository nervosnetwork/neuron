import { FieldRequiredException, URLProtocolRequiredException, URLNoWhiteSpacesException } from 'exceptions'

export const validateURL = (url: string) => {
  if (!url) {
    throw new FieldRequiredException('remote')
  }
  if (!/^https?:\/\//.test(url)) {
    throw new URLProtocolRequiredException(url)
  }
  if (/\s/.test(url)) {
    throw new URLNoWhiteSpacesException()
  }
  return true
}

export default validateURL
