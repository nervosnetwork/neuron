import OutPoint, { OutPointInterface } from './out-point'

export enum DepType {
  Code = 'code',
  DepGroup = 'depGroup',
}

export interface CellDepInterface {
  outPoint: OutPointInterface
  depType: DepType
}

export class CellDep implements CellDepInterface {
  private _outPoint: OutPoint
  private _depType: DepType

  constructor({ outPoint, depType }: CellDepInterface) {
    this._outPoint = outPoint ? (outPoint instanceof OutPoint ? outPoint : new OutPoint(outPoint)) : outPoint
    this._depType = depType
  }

  public get outPoint(): OutPoint {
    return this._outPoint
  }

  public get depType(): DepType {
    return this._depType
  }

  public toInterface(): CellDepInterface {
    return {
      outPoint: this.outPoint.toInterface(),
      depType: this.depType,
    }
  }

  public toSDK(): CKBComponents.CellDep {
    return {
      outPoint: this.outPoint.toSDK(),
      depType: this.depType,
    }
  }

  public static fromSDK(cellDep: CKBComponents.CellDep): CellDep {
    return new CellDep({
      outPoint: OutPoint.fromSDK(cellDep.outPoint!),
      depType: cellDep.depType as DepType,
    })
  }
}
