import { In, Not } from 'typeorm'
import SudtTokenInfoEntity from '../database/chain/entities/sudt-token-info'
import { getConnection } from '../database/chain/connection'
import { UDTType } from '../utils/const'

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

  static getSudtTokenInfo(typeArgs: string, udtType: UDTType): Promise<SudtTokenInfoEntity | null> {
    return getConnection()
      .getRepository(SudtTokenInfoEntity)
      .createQueryBuilder('info')
      .leftJoinAndSelect('info.assetAccounts', 'aa')
      .where(`info.tokenID = :typeArgs AND info.udtType = :udtType`, {
        typeArgs,
        udtType,
      })
      .getOne()
  }
}
