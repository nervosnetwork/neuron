import fs from 'fs'
import sqlite3 from 'sqlite3'
import { get as getDescription } from 'database/leveldb/transaction-description'
import i18n from 'locales/i18n'
import shannonToCKB from 'utils/shannonToCKB'


interface ExportHistoryParms {
  walletID: string
  dbPath: string
  lockHashList?: string[]
  filePath: string
}
const exportHistory = ({
  walletID,
  dbPath,
  lockHashList = [],
  filePath
}: ExportHistoryParms): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!dbPath) {
      return reject(new Error(`Database is required`))
    }

    if (!Array.isArray(lockHashList)) {
      return reject(new Error(`Lock hash list is expected to be an array`))
    }

    if (!filePath) {
      return reject(new Error(`File Path is required`))
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    let total: number | undefined
    let inserted = 0

    const writeStream = fs.createWriteStream(filePath)
    writeStream.write(
      `${['time', 'block-number', 'tx-hash', 'tx-type', 'amount', 'description']
        .map(label => i18n.t(`export-transactions.column.${label}`))}\n`
    )

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY)
    const serializedlockHashList = lockHashList.map(l => `'${l}'`).join(`,`)

    const onRowLoad = (err: Error, row: {
      hash: string,
      inputShannon: string | null,
      timestamp: string,
      blockNumber: string,
      description: string
    }) => {
      db.serialize(() => {
        if (err) {
          return reject(err)
        }
        db.get(
          `
          SELECT
            CAST(SUM(CAST(output.capacity AS UNSIGNED BIG ING)) AS VARCHAR) outputShannon
          FROM
            output
          WHERE
            (output.transactionHash = ? AND output.lockHash IN (${serializedlockHashList}))
          GROUP BY
            output.transactionHash
          `,
          [row.hash],
          async (err, { outputShannon }) => {
            if (err) {
              return reject(err)
            }
            const description = await getDescription(walletID, row.hash)
            const totalInput = BigInt(row.inputShannon || `0`)
            const totalOutput = BigInt(outputShannon || `0`)
            let txType = `-`
            if (totalInput > totalOutput) {
              txType = 'Send'
            } else if (totalInput < totalOutput) {
              txType = 'Receive'
            }
            const amount = shannonToCKB(totalOutput - totalInput)
            writeStream.write(
              `${new Date(+row.timestamp).toISOString()},${row.blockNumber},${
              row.hash
              },${txType},${amount},"${description}"\n`,
              err => {
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
        )
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
          tx.hash IN (
            SELECT output.transactionHash FROM output WHERE output.lockHash IN (${serializedlockHashList})
            UNION
            SELECT input.transactionHash FROM input WHERE input.lockHash IN (${serializedlockHashList})
          )
        AND
          tx.timestamp IS NOT NULL
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
