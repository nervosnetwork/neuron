import { ComparisonOptions, SqliteDataComparator } from './sqlite-data-comparator'

const transaction_options: ComparisonOptions = {
  fileName: 'transaction_result.md',
  excludedFields: ['createdAt', 'updatedAt'],
  tableToCompare: 'transaction',
}
const asset_account_options: ComparisonOptions = {
  fileName: 'asset_account_result.md',
  excludedFields: ['id'],
  tableToCompare: 'asset_account',
}
const hd_public_key_info_options: ComparisonOptions = {
  fileName: 'hd_public_key_info_result.md',
  excludedFields: ['id', 'createdAt'], // id
  tableToCompare: 'hd_public_key_info',
}
const input_options: ComparisonOptions = {
  fileName: 'input_result.md',
  excludedFields: ['id'],
  tableToCompare: 'input',
}
const output_options: ComparisonOptions = {
  fileName: 'output_result.md',
  excludedFields: ['id'],
  tableToCompare: 'output',
}

const sudt_token_info_options: ComparisonOptions = {
  fileName: 'sudt_token_info_result.md',
  excludedFields: ['id'],
  tableToCompare: 'sudt_token_info',
}
const tx_lock_options: ComparisonOptions = {
  fileName: 'tx_lock_result.md',
  excludedFields: [],
  tableToCompare: 'tx_lock',
}

const indexer_tx_hash_cache_options: ComparisonOptions = {
  fileName: 'indexer_tx_hash_cache_result.md',
  excludedFields: ['id', 'createdAt', 'updatedAt', 'blockHash', 'blockTimestamp', 'address'],
  tableToCompare: 'indexer_tx_hash_cache',
}

export const compareNeuronDatabase = async (database1Path: string, database2Path: string, resultSavePath: string) => {
  let comparator = new SqliteDataComparator(database1Path, database2Path)

  try {
    let compare_tables = [
      transaction_options,
      asset_account_options,
      hd_public_key_info_options,
      indexer_tx_hash_cache_options,
      input_options,
      output_options,
      sudt_token_info_options,
      tx_lock_options,
    ]
    for (let i = 0; i < compare_tables.length; i++) {
      let table = compare_tables[i]
      await comparator.compare(table, resultSavePath)
    }
    console.table(comparator.compareResult)
  } catch (e) {
    console.error(e)
    return false
  } finally {
    comparator.close()
  }
  return comparator.compareResult.result
}
