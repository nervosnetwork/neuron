import fs from 'fs'
import { promisify } from 'util'
import i18n from 'locales/i18n'
import TransactionsService from 'services/tx/transaction-service'
import AddressService from 'services/addresses'
import { ChainType } from 'models/network'
import toCSVRow from 'utils/to-csv-row'
import { get as getDescription } from 'database/leveldb/transaction-description'

const exportHistory = async ({
  walletID,
  filePath,
  chainType = 'ckb',
}: { walletID: string, filePath: string, chainType: ChainType | string }) => {
  if (!walletID) {
    throw new Error("Wallet ID is required")
  }

  if (!filePath) {
    throw new Error(`File Path is required`)
  }

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }

  const includeSUDT = chainType === 'ckb_testnet'
  const headers = includeSUDT
    ? ['time', 'block-number', 'tx-hash', 'tx-type', 'amount', 'udt-amount', 'description']
    : ['time', 'block-number', 'tx-hash', 'tx-type', 'amount', 'description']

  const ws = fs.createWriteStream(filePath)
  const wsPromises: any = new Proxy(ws, {
    get(target, key: keyof typeof ws, receiver) {
      if (typeof target[key] === 'function') {
        return promisify(Reflect.get(target, key, receiver)).bind(target)
      }
      return Reflect.get(target, key, receiver)
    }
  })
  await wsPromises.write(
    `${headers.map(label => i18n.t(`export-transactions.column.${label}`))}\n`
  )

  const addresses = AddressService.allAddressesByWalletId(walletID).map(addr => addr.address)
  const { totalCount } = await TransactionsService.getAllByAddresses({ pageNo: 1, pageSize: 1, addresses, walletID })
  const { items } = await TransactionsService.getAllByAddresses({ pageNo: 1, pageSize: totalCount, addresses, walletID })

  for (const tx of items.reverse()) {
    if (tx.status !== 'success') { continue }
    const description = await getDescription(walletID, tx.hash!)
    const data = toCSVRow({ ...tx, description }, includeSUDT)
    await wsPromises.write(data)
  }

  wsPromises.end()
  return totalCount
}

export default exportHistory
