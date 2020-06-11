import fs from 'fs'
import { promisify } from 'util'
import sqlite3 from 'sqlite3'
import { get as getDescription } from 'database/leveldb/transaction-description'
import i18n from 'locales/i18n'
import AssetAccountInfo from 'models/asset-account-info'
import shannonToCKB from 'utils/shannonToCKB'
import sudtValueToAmount from 'utils/sudt-value-to-amount'
import BufferUtils from 'utils/buffer'
import { ChainType } from 'models/network'

const formatDatetime = (datetime: Date) => {
  const isoFmt = datetime.toISOString()
  return `${isoFmt.substr(0, 10)} ${isoFmt.substr(11, 12)}`
}

interface ExportHistoryParms {
  walletID: string
  dbPath: string
  lockHashList?: string[]
  anyoneCanPayLockHashList?: string[]
  filePath: string
  chainType?: ChainType | string
}

namespace QueryParams {
  export interface Inputs {
    hash: CKBComponents.Hash
    codeHash: CKBComponents.Hash
    hashType: CKBComponents.ScriptHashType
  }
  export type Outputs = Inputs
  export interface Aggr {
    hash: CKBComponents.Hash
  }
}

namespace QueryResponse {
  export interface Transaction {
    hash: string,
    inputShannon: string | null,
    timestamp: string,
    blockNumber: string,
    description: string
  }

  interface Input {
    typeCodeHash: string | null
    typeArgs: string | null
    typeHashType: CKBComponents.ScriptHashType | null
    data: string | null
  }
  type Output = Input
  export type Inputs = Input[]
  export type Outputs = Output[]
  export interface Aggr {
    outputShannon: string | null,
    daoCellCount: number
  }
}


const exportHistory = async ({
  walletID,
  dbPath,
  lockHashList = [],
  anyoneCanPayLockHashList = [],
  filePath,
  chainType = 'ckb',
}: ExportHistoryParms): Promise<number> => {

  if (!dbPath) {
    throw new Error(`Database is required`)
  }

  if (!Array.isArray(lockHashList)) {
    throw new Error(`Lock hash list is expected to be an array`)
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
  const SEND_TYPE = i18n.t('export-transactions.tx-type.send')
  const RECEIVE_TYPE = i18n.t('export-transactions.tx-type.receive')

  const serializedlockHashList = [...lockHashList, ...anyoneCanPayLockHashList].map(l => `'${l}'`).join(`,`)
  const { sudt } = new AssetAccountInfo().infos

  const writeStream = fs.createWriteStream(filePath)
  writeStream.write(
    `${headers.map(label => i18n.t(`export-transactions.column.${label}`))}\n`
  )

  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY)
  const dbPromises: any = new Proxy(db, {
    get(target, key: keyof typeof db, receiver) {
      if (typeof target[key] === 'function') {
        return promisify(Reflect.get(target, key, receiver)).bind(target)
      }
      return Reflect.get(target, key, receiver)
    }
  })

  let total: number | undefined
  let inserted = 0

  const queryInputs = ({ hash, codeHash, hashType }: QueryParams.Inputs): Promise<QueryResponse.Inputs> =>
    dbPromises.all(
      `
      SELECT
        typeCodeHash,
        typeArgs,
        typeHashType,
        data
      FROM
        input
      WHERE
        input.transactionHash = ?
        AND input.typeCodeHash = ?
        AND input.typeHashType = ?
        AND input.lockHash IN (${serializedlockHashList})
      `,
      [hash, codeHash, hashType]
    )

  const queryOutputs = ({ hash, codeHash, hashType }: QueryParams.Outputs): Promise<QueryResponse.Outputs> => dbPromises.all(
    `
    SELECT
      typeCodeHash,
      typeArgs,
      typeHashType,
      data
    FROM
      output
    WHERE
      output.transactionHash = ?
      AND output.typeCodeHash = ?
      AND output.typeHashType = ?
      AND output.lockHash IN (${serializedlockHashList})
    `,
    [hash, codeHash, hashType]
  )

  const aggrQuery = ({ hash }: QueryParams.Aggr): Promise<QueryResponse.Aggr> =>
    dbPromises.get(
      `
      SELECT
        CAST(SUM(CAST(output.capacity AS UNSIGNED BIG ING)) AS VARCHAR) outputShannon,
        COUNT(output.daoData) daoCellCount
      FROM
        output
      WHERE
        output.transactionHash = ?
        AND output.lockHash IN (${serializedlockHashList})
      GROUP BY
        output.transactionHash
      `,
      [hash]
    )

  const tokenInfoList: { tokenID: string, symbol: string | null, decimal: string | null }[] = await dbPromises.all(
    `
    SELECT
      tokenID,
      symbol,
      decimal
    FROM
      sudt_token_info
    `
  )

  return new Promise((resolve, reject) => {

    const handleTransaction = async (
      {
        hash,
        outputShannon = '0',
        inputShannon = '0',
        sUDTValue = '',
        daoCellCount = 0,
        blockNumber,
        timestamp,
        typeArgs,
      }: QueryResponse.Transaction & {
        outputShannon: string | null,
        daoCellCount: number,
        sUDTValue: string,
        typeArgs: string | null
      }
    ) => {
      const description = await getDescription(walletID, hash)
      const totalInput = BigInt(inputShannon || `0`)
      const totalOutput = BigInt(outputShannon || `0`)
      let txType = `-`
      if (includeSUDT && sUDTValue !== '') {
        txType = 'UDT ' + (BigInt(sUDTValue) > 0 ? RECEIVE_TYPE : SEND_TYPE)
      } else if (daoCellCount > 0) {
        txType = 'Nervos DAO'
      } else if (totalInput >= totalOutput) {
        txType = SEND_TYPE
      } else {
        txType = RECEIVE_TYPE
      }

      const DEFAULT_SYMBOL = 'Unknown'
      const amount = includeSUDT && sUDTValue !== '' ? '' : shannonToCKB(totalOutput - totalInput)

      const tokenInfo = tokenInfoList.find((info: { tokenID: string }) => info.tokenID === typeArgs)
      const decimal = tokenInfo?.decimal
      const symbol = tokenInfo?.symbol || DEFAULT_SYMBOL
      const sUDTAmount = sUDTValue === '' ? '' : `${sudtValueToAmount(sUDTValue, decimal)} ${symbol}`

      const data = includeSUDT
        ? `${formatDatetime(new Date(+timestamp))},${blockNumber},${hash},${txType},${amount},${sUDTAmount},"${description}"\n`
        : `${formatDatetime(new Date(+timestamp))},${blockNumber},${hash},${txType},${amount},"${description}"\n`

      writeStream.write(data, err => {
        if (err) {
          return reject(err)
        }
        if (++inserted === total) {
          writeStream.end()
          return resolve(total)
        }
      }
      )
    }

    const onRowLoad = (err: Error, row: QueryResponse.Transaction) => {
      db.serialize(async () => {
        if (err) {
          return reject(err)
        }
        try {
          const [sUDTInputs, sUDTOutputs, { outputShannon, daoCellCount }] = await Promise.all([
            queryInputs({ hash: row.hash, codeHash: sudt.codeHash, hashType: sudt.hashType }),
            queryOutputs({ hash: row.hash, codeHash: sudt.codeHash, hashType: sudt.hashType }),
            aggrQuery({ hash: row.hash }),
          ])

          const typeArgs = sUDTInputs[0]?.typeArgs ?? sUDTOutputs[0]?.typeArgs
          let sUDTValue = ''
          if (typeArgs) {

            const sumSUDT = (cells: QueryResponse.Inputs | QueryResponse.Outputs) =>
              cells
                .filter(c => c.typeArgs === typeArgs)
                .reduce((sum, c) => {
                  return c.data ? sum + BufferUtils.parseAmountFromSUDTData(c.data) : sum
                }, BigInt(0))

            sUDTValue = `${sumSUDT(sUDTOutputs) - sumSUDT(sUDTInputs)}`
          }
          return handleTransaction({ ...row, outputShannon, daoCellCount, sUDTValue, typeArgs })
        } catch (err) {
          return reject(err)
        }
      })
    }

    const onCompleted = (err: Error, retrieved: number) => {
      if (err) {
        return reject(err)
      }
      db.close()
      if (!retrieved) {
        writeStream.end()
        return resolve(0)
      }
      total = retrieved
    }

    db.serialize(() => {
      db.each(
        `
        SELECT
          tx.hash,
          tx.timestamp,
          tx.blockNumber,
          CAST(SUM(CAST(input.capacity AS UNSIGNED BIG INT)) AS VARCHAR) inputShannon
        FROM 'transaction' AS tx
        LEFT JOIN
          input ON (input.transactionHash = tx.hash AND input.lockHash in (${serializedlockHashList}))
        WHERE
          tx.timestamp IS NOT NULL
        AND
          tx.status = 'success'
        AND
          tx.hash IN (
            SELECT output.transactionHash FROM output WHERE output.lockHash IN (${serializedlockHashList})
            UNION
            SELECT input.transactionHash FROM input WHERE input.lockHash IN (${serializedlockHashList})
          )
        GROUP BY
          tx.hash
        ORDER BY
          CAST(tx.timestamp AS UNSIGNED BIG INT)
        `,
        onRowLoad,
        onCompleted
      )
    })

  })
}

export default exportHistory
