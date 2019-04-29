import { getConnection, In } from 'typeorm'
import asw from '../wallets/asw'
import OutputEntity from '../entities/Output'
import { Input } from './transactions'

const MIN_CELL_CAPACITY = '40'

export interface OutPoint {
  hash: string
  index: number
}

export interface Script {
  args?: string[]
  binaryHash?: string | null
}

// FIXME: should update capacity to string
export interface Cell {
  capacity: string
  data?: string
  lock: Script
  type?: Script | null
  outPoint?: OutPoint
  status?: string
  lockHash?: string
}

/* eslint @typescript-eslint/no-unused-vars: "warn" */
/* eslint no-await-in-loop: "warn" */
/* eslint no-restricted-syntax: "warn" */
export default class CellsService {
  public static getBalance = async (lockHashes: string[]): Promise<string> => {
    const cells: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .find({
        where: {
          lockHash: In(lockHashes),
          status: 'live',
        },
      })

    const capacity: bigint = cells.map(c => BigInt(c.capacity)).reduce((result, c) => result + c, BigInt(0))

    return capacity.toString()
  }

  public static getLiveCell = async (outPoint: OutPoint): Promise<Cell | undefined> => {
    const cellEntity: OutputEntity | undefined = await CellsService.getLiveCellEntity(outPoint)

    if (!cellEntity) {
      return undefined
    }

    return cellEntity.toInterface()
  }

  private static getLiveCellEntity = async (outPoint: OutPoint): Promise<OutputEntity | undefined> => {
    const cellEntity: OutputEntity | undefined = await getConnection()
      .getRepository(OutputEntity)
      .findOne({
        outPointHash: outPoint.hash,
        outPointIndex: outPoint.index,
        status: 'live',
      })

    return cellEntity
  }

  // gather inputs for generateTx
  public static gatherInputs = async (capacity: string, lockHashes: string[]) => {
    const capacityInt = BigInt(capacity)

    if (capacityInt < BigInt(MIN_CELL_CAPACITY)) {
      throw new Error(`capacity can't be less than ${MIN_CELL_CAPACITY}`)
    }

    // only live cells
    const cellEntities: OutputEntity[] = await getConnection()
      .getRepository(OutputEntity)
      .find({
        where: {
          lockHash: In(lockHashes),
          status: 'live',
        },
      })
    cellEntities.sort((a, b) => +a.capacity - +b.capacity)

    const inputs: Input[] = []
    let inputCapacities: bigint = BigInt(0)
    cellEntities.every(cell => {
      const input: Input = {
        previousOutput: cell.outPoint(),
        args: [],
      }
      inputs.push(input)
      inputCapacities += BigInt(cell.capacity)
      if (inputCapacities > capacityInt) {
        return false
      }
      return true
    })

    if (inputCapacities < capacityInt) {
      throw new Error('Capacity not enough')
    }

    return {
      inputs,
      capacities: inputCapacities.toString(),
    }
  }

  public static getUnspentCells = async () => {
    const cells = await asw.getUnspentCells()
    return cells
  }
}
