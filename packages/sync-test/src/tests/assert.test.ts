import { compareNeuronDatabase } from '../services/neuron-sql-server'

describe('query sqlite3', function () {
  it.skip('compare old to new asset_account', async () => {
    // init db is default, after new db compare to the init
    const dbPath1 =
      'source/neuron-cell-data/2000/fullNode/wallet1/cell-0x9c96d0b369b5fd42d7e6b30d6dfdb46e32dac7293bf84de9d1e2d11ca7930717.sqlite'
    const dbPath2 =
      'tmp/fullNode/wallet1/cell-0x9c96d0b369b5fd42d7e6b30d6dfdb46e32dac7293bf84de9d1e2d11ca7930717.sqlite'
    await compareNeuronDatabase(dbPath1, dbPath2, 'tmp/fullNode')
  })
})
