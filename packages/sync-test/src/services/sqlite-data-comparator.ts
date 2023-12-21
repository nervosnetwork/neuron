import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'

export interface ComparisonOptions {
  fileName: string
  excludedFields: string[]
  tableToCompare: string
}

interface RowData {
  [key: string]: any
}

interface CompareResult {
  result: boolean

  [key: string]: boolean
}

export class SqliteDataComparator {
  private db1: sqlite3.Database
  private db2: sqlite3.Database
  public compareResult: CompareResult

  constructor(database1Path: string, database2Path: string) {
    this.db1 = new sqlite3.Database(database1Path)
    this.db2 = new sqlite3.Database(database2Path)
    this.compareResult = { result: true }
  }

  private formatTableMarkdown(rows: any[]): string {
    if (rows.length === 0) {
      return 'No records found.'
    }

    const keys = Object.keys(rows[0])
    const header = `| ${keys.join(' | ')} |\n| ${keys.map(() => '---').join(' | ')} |`

    const formattedRows = rows.map(
      row => `| ${keys.map(key => (row[key] !== null && row[key] !== undefined ? row[key] : 'NULL')).join(' | ')} |`
    )

    return `${header}\n${formattedRows.join('\n')}`
  }

  private formatOutputToFile(path: string, output: string) {
    fs.appendFileSync(path, `${output}\n\n`)
  }

  private async compareTableData(path: string, tableName: string, excludedFields: string[]) {
    return new Promise<void>((resolve, reject) => {
      this.db1.all(
        `SELECT *
         FROM [${tableName}]`,
        (err, rowsDb1: RowData[]) => {
          if (err) {
            reject(err)
            return
          }

          this.db2.all(
            `SELECT *
             FROM [${tableName}]`,
            (err, rowsDb2: RowData[]) => {
              if (err) {
                reject(err)
                return
              }

              const uniqueToDb1 = rowsDb1.filter(
                row1 =>
                  !rowsDb2.some(row2 =>
                    Object.keys(row1)
                      .filter(key => !excludedFields.includes(key))
                      .every(key => row1[key] === row2[key])
                  )
              )

              const uniqueToDb2 = rowsDb2.filter(
                row2 =>
                  !rowsDb1.some(row1 =>
                    Object.keys(row2)
                      .filter(key => !excludedFields.includes(key))
                      .every(key => row1[key] === row2[key])
                  )
              )
              let ret = uniqueToDb1.length == 0 && uniqueToDb2.length == 0
              console.log(
                `${tableName} uniqueToDb1.length:${uniqueToDb1.length},uniqueToDb2.length:${uniqueToDb2.length} `
              )
              if (!ret) {
                fs.writeFileSync(path, '')
                const output =
                  `## Table: ${tableName}\n\n` +
                  `### Unique to Database 1:\n${this.formatTableMarkdown(uniqueToDb1)}\n\n` +
                  `### Unique to Database 2:\n${this.formatTableMarkdown(uniqueToDb2)}\n\n`
                this.formatOutputToFile(path, output)
                console.log('compare failed ')
                this.compareResult[tableName] = false
                this.compareResult.result = false
                resolve()
              } else {
                this.compareResult[tableName] = true
                console.log('compare successful ')
              }
              resolve()
            }
          )
        }
      )
    })
  }

  async compare(options: ComparisonOptions, dirName: string) {
    const { excludedFields, tableToCompare } = options
    console.log(`compare:${options.fileName}`)
    let savePath = path.join(dirName, options.fileName)
    try {
      await this.compareTableData(savePath, tableToCompare, excludedFields)
      console.log('compare finished :', options.fileName)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  close() {
    this.db1.close()
    this.db2.close()
  }
}
