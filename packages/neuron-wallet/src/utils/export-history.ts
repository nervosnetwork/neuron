import fs from 'fs'
import { promisify } from 'util'
import { t } from 'i18next'
import TransactionsService from '../services/tx/transaction-service'
import AddressService from '../services/addresses'
import Transaction from '../models/chain/transaction'
import toCSVRow from '../utils/to-csv-row'
import { get as getDescription } from '../services/tx/transaction-description'

const exportHistory = async ({ walletID, filePath }: { walletID: string; filePath: string }) => {
  if (!walletID) {
    throw new Error('Wallet ID is required')
  }

  if (!filePath) {
    throw new Error(`File Path is required`)
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  const headers = ['time', 'block-number', 'tx-hash', 'tx-type', 'amount', 'udt-amount', 'description']

  const ws = fs.createWriteStream(filePath)
  const wsPromises: any = new Proxy(ws, {
    get(target, key: keyof typeof ws, receiver) {
      const meta = Reflect.get(target, key, receiver)
      if (typeof meta === 'function') {
        return promisify(meta).bind(target)
      }
      return meta
    },
  })
  await wsPromises.write(`${headers.map(label => t(`export-transactions.column.${label}`))}\n`)

  const allAddresses = await AddressService.getAddressesByWalletId(walletID)

  const addresses = allAddresses.map(addr => addr.address)
  const PAGE_SIZE = 100
  let count = Infinity
  let txs: Transaction[] = []
  let pageNo = 1

  while (pageNo <= Math.ceil(count / PAGE_SIZE)) {
    const { totalCount, items } = await TransactionsService.getAllByAddresses({
      pageNo,
      pageSize: PAGE_SIZE,
      addresses,
      walletID,
    })
    count = totalCount
    txs.push(...items.filter(item => item.status === 'success'))
    pageNo++
  }

  for (const tx of txs.reverse()) {
    const description = await getDescription(walletID, tx.hash!)
    const data = toCSVRow({ ...tx, description })
    await wsPromises.write(data)
  }

  wsPromises.end()
  return count
}

export default exportHistory
