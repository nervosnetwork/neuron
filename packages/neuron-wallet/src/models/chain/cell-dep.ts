import OutPoint from './out-point'

export enum DepType {
  Code = 'code',
  DepGroup = 'depGroup',
}

export default class CellDep {
  constructor(
    public outPoint: OutPoint,
    public depType: DepType
  ) {}

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
