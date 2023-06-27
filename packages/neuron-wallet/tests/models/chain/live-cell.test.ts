import Script, { ScriptHashType } from '../../../src/models/chain/script'
import { LumosCell } from '../../../src/block-sync-renderer/sync/connector'
import LiveCell from "../../../src/models/chain/live-cell"

describe('LiveCell Test', () => {
  const INITIAL_DATA = {
    txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    outputIndex: '0x1',
    capacity: '0x2',
    lock: {
      codeHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      hashType: ScriptHashType.Data,
      args: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    },
    type: {
      codeHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      hashType: ScriptHashType.Data1,
      args: '0xdddddddddddddddddddddddddddddddddddddddd',
    },
    data: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  }

  let liveCell: LiveCell

  beforeAll(() => {
    liveCell = new LiveCell(
      INITIAL_DATA.txHash,
      INITIAL_DATA.outputIndex,
      INITIAL_DATA.capacity,
      new Script(INITIAL_DATA.lock.codeHash, INITIAL_DATA.lock.args, INITIAL_DATA.lock.hashType),
      new Script(INITIAL_DATA.type.codeHash, INITIAL_DATA.type.args, INITIAL_DATA.type.hashType),
      INITIAL_DATA.data
    )
  })

  it('should have initial properties', () => {
    expect(liveCell).toMatchObject({
      txHash: INITIAL_DATA.txHash,
      outputIndex: '1',
      capacity: '2',
      lockHash: '0xfd7dc5cc9794ff6563b53581a90c3896e2af54c64d27945559e05d36aca44698',
      lockHashType: INITIAL_DATA.lock.hashType,
      lockCodeHash: INITIAL_DATA.lock.codeHash,
      lockArgs: INITIAL_DATA.lock.args,
      typeHash: '0x0bbfd38af1bee8669d6718397348de27be18707c54880c4cb61527ec6074cc40',
      typeHashType: INITIAL_DATA.type.hashType,
      typeCodeHash: INITIAL_DATA.type.codeHash,
      typeArgs: INITIAL_DATA.type.args,
      data: INITIAL_DATA.data,
    })
  })

  it('should have outpoint', () => {
    expect(liveCell.outPoint()).toMatchObject({
      txHash: INITIAL_DATA.txHash,
      index: '1',
    })
  })

  it('should have lock script', () => {
    expect(liveCell.lock()).toMatchObject({
      codeHash: INITIAL_DATA.lock.codeHash,
      hashType: INITIAL_DATA.lock.hashType,
      args: INITIAL_DATA.lock.args,
    })
  })

  describe('type script', () => {
    it('should have type', () => {
      expect(liveCell.type()).toMatchObject({
        codeHash: INITIAL_DATA.type.codeHash,
        hashType: INITIAL_DATA.type.hashType,
        args: INITIAL_DATA.type.args,
      })
    })

    it('should have no type when type is null', () => {
      const cell = new LiveCell(
        INITIAL_DATA.txHash,
        INITIAL_DATA.outputIndex,
        INITIAL_DATA.capacity,
        new Script(INITIAL_DATA.lock.codeHash, INITIAL_DATA.lock.args, INITIAL_DATA.lock.hashType),
        null,
        INITIAL_DATA.data
      )
      expect(cell.type()).toBe(undefined)
    })
  })

  describe('get cells from lumos cell', () => {
    const LUMOS_CELL: LumosCell = {
      blockHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      outPoint: {
        txHash: INITIAL_DATA.txHash,
        index: INITIAL_DATA.outputIndex,
      },
      cellOutput: {
        capacity: INITIAL_DATA.capacity,
        lock: {
          codeHash: INITIAL_DATA.lock.codeHash,
          hashType: INITIAL_DATA.lock.hashType,
          args: INITIAL_DATA.lock.args,
        },
        type: {
          codeHash: INITIAL_DATA.type.codeHash,
          hashType: INITIAL_DATA.type.hashType,
          args: INITIAL_DATA.type.args,
        },
      },
      data: INITIAL_DATA.data,
    }

    it('have type script', () => {
      const cell = LiveCell.fromLumos(LUMOS_CELL)
      expect(cell).toMatchObject({
        txHash: INITIAL_DATA.txHash,
        outputIndex: '1',
        capacity: '2',
        lockHash: '0xfd7dc5cc9794ff6563b53581a90c3896e2af54c64d27945559e05d36aca44698',
        lockHashType: INITIAL_DATA.lock.hashType,
        lockCodeHash: INITIAL_DATA.lock.codeHash,
        lockArgs: INITIAL_DATA.lock.args,
        typeHash: '0x0bbfd38af1bee8669d6718397348de27be18707c54880c4cb61527ec6074cc40',
        typeHashType: INITIAL_DATA.type.hashType,
        typeCodeHash: INITIAL_DATA.type.codeHash,
        typeArgs: INITIAL_DATA.type.args,
        data: INITIAL_DATA.data,
      })
    })

    it('should have no type script', () => {
      const cell = LiveCell.fromLumos({ ...LUMOS_CELL, cellOutput: { ...LUMOS_CELL.cellOutput, type: undefined } })
      expect(cell).toMatchObject({
        txHash: INITIAL_DATA.txHash,
        outputIndex: '1',
        capacity: '2',
        lockHash: '0xfd7dc5cc9794ff6563b53581a90c3896e2af54c64d27945559e05d36aca44698',
        lockHashType: INITIAL_DATA.lock.hashType,
        lockCodeHash: INITIAL_DATA.lock.codeHash,
        lockArgs: INITIAL_DATA.lock.args,
        data: INITIAL_DATA.data,
      })
    })
  })
})
