import asw from './wallets/asw'

const getUnspentCells = async () => {
  const cells = await asw.getUnspentCells()
  return cells
}

export default getUnspentCells
