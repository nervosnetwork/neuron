import OutPoint from './out-point'

export enum DepType {
  Code = 'code',
  DepGroup = 'depGroup',
}

export default class CellDep {
  public outPoint: OutPoint
  public depType: DepType

  constructor(outPoint: OutPoint, depType: DepType) {
    this.outPoint = outPoint
    this.depType = depType
  }

  public static fromObject({ outPoint, depType }: { outPoint: OutPoint, depType: DepType }): CellDep {
    return new CellDep(
      OutPoint.fromObject(outPoint),
      depType,
    )
  }

  public toSDK(): CKBComponents.CellDep {
    return {
      outPoint: this.outPoint.toSDK(),
      depType: this.depType,
    }
  }

  public static fromSDK(cellDep: CKBComponents.CellDep): CellDep {
    return new CellDep(
      OutPoint.fromSDK(cellDep.outPoint!),
      cellDep.depType as DepType,
    )
  }
}
