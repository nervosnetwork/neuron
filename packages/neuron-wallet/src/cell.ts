import asw from './wallets/asw'
import ckbCore from './core'

const MIN_CELL_CAPACITY: string = '40'

export interface OutPoint {
  hash: string
  index: number
}

interface Script {
  version: number
  args?: string[]
  signedArgs: string[]
  reference?: string | null
  binary?: string
}

// FIXME: should update capacity to string
export interface Cell {
  capacity: number
  data: string
  lock: string
  type?: Script | null
  outPoint?: OutPoint
}

interface Input {
  previousOutput: OutPoint
  unlock: Script
}

// const mockedPrivKey: string = 'e79f3207ea4980b7fed79956d5934249ceac4751a4fae01a0f7c4a96884bc4e3'
const mockedPublicKey: string = '024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01'
const mockedAddress: string = '0xbada2cdf5bd644508a0892d17e3c9fba860382a036b600218d20fcdb2e3e816d'

// the system script cell hash
const systemScriptCellHash = '0x828d1e109a79964521bf5fbbedb4f6e695a9c4b6b674a58887f30c7398e93a76'
const systemScriptOutPoint: OutPoint = {
  hash: '',
  index: 0,
}

export const getUnspentCells = async () => {
  const cells = await asw.getUnspentCells()
  return cells
}

export const getLiveCell = async (outPoint: OutPoint) => {
  const liveCell = await ckbCore.rpc.getLiveCell(outPoint)
  return liveCell
}

const verifyScriptJsonObject = () => {
  const signedArgs = [mockedPublicKey]

  return {
    version: 0,
    reference: systemScriptCellHash,
    signedArgs,
  }
}

// it's still a mocked interface
// FIXME: replace number with BigInt
const gatherInputs = async (capacity: string, minCapacity: string) => {
  const capacityInt: number = parseInt(capacity, 10)
  const minCapacityInt: number = parseInt(minCapacity, 10)

  if (capacityInt < minCapacityInt) {
    throw new Error(`capacity cannot be less than ${minCapacity}`)
  }

  let inputCapacities: number = 0
  const inputs: Input[] = []
  const unspentCells = await getUnspentCells()
  unspentCells.every(cell => {
    const input: Input = {
      previousOutput: cell.outPoint,
      unlock: verifyScriptJsonObject(),
    }

    inputs.push(input)
    inputCapacities += cell.capacity
    if (inputCapacities >= capacityInt && inputCapacities - capacityInt >= minCapacityInt) {
      return false
    }
    return true
  })
  if (inputCapacities < capacityInt) {
    throw new Error('Not enough capacity!')
  }
  return {
    inputs,
    capacities: inputCapacities.toString(),
  }
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
const generateTx = async (address: string, capacity: string) => {
  const { inputs, capacities } = await gatherInputs(capacity, MIN_CELL_CAPACITY)
  const inputCapacities: number = parseInt(capacities, 10)
  const capacityInt: number = parseInt(capacity, 10)

  const outputs: Cell[] = [
    {
      capacity: parseInt(capacity, 10),
      data: '',
      lock: address,
    },
  ]
  if (inputCapacities > capacityInt) {
    const output: Cell = {
      capacity: inputCapacities - capacityInt,
      data: '',
      lock: mockedAddress,
    }
    outputs.push(output)
  }

  return {
    version: 0,
    deps: [systemScriptOutPoint],
    inputs,
    outputs,
  }
}

// mock interface, use asw as ours wallet as mocked data.
// TODO: should replace asw with wallet, now SDK data not be compatible
export const sendCapacity = async (targets: { address: string; capacity: string }[]) => {
  const firstTarget = targets[0]
  const capacity: number = parseInt(firstTarget.capacity, 10)
  const result = await asw.sendCapacity(firstTarget.address, capacity)
  return result
}

export default {
  getUnspentCells,
  getLiveCell,
}
