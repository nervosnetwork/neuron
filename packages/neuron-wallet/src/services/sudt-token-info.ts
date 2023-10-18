import { In, Not, getConnection } from 'typeorm'
import SudtTokenInfoEntity from '../database/chain/entities/sudt-token-info'

export default class SudtTokenInfoService {
  static async findSudtTokenInfoByArgs(typeArgsList: string[]) {
    const sudtTokenInfoList = await getConnection()
      .getRepository(SudtTokenInfoEntity)
      .find({
        where: {
          tokenID: In(typeArgsList),
          tokenName: Not(''),
          symbol: Not(''),
          decimal: Not(''),
        },
      })
    return sudtTokenInfoList.map(item => item.toModel())
  }

  static async getAllSudtTokenInfo() {
    const sudtTokenInfoList = await getConnection()
      .getRepository(SudtTokenInfoEntity)
      .find({
        where: {
          tokenID: Not(''),
          tokenName: Not(''),
          symbol: Not(''),
          decimal: Not(''),
        },
      })
    return sudtTokenInfoList.map(item => item.toModel())
  }

  static async insertSudtTokenInfo(sudtTokenInfoEntity: SudtTokenInfoEntity) {
    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(SudtTokenInfoEntity)
      .values(sudtTokenInfoEntity)
      .orIgnore(`("tokenID") DO NOTHING`)
      .execute()
  }

  static getSudtTokenInfo(tokenID: string) {
    return getConnection().getRepository(SudtTokenInfoEntity).findOne({
      tokenID,
    })
  }
}
