import { useState } from '../../states'

export const usePerun = () => {
  const { perunState } = useState()
  // TODO: Register some callbacks here if needed.
  return perunState
}
