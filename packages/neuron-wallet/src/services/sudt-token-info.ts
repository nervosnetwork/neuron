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

  static getSudtTokenInfo(typeArgs: string, walletId: string) {
    return getConnection()
      .getRepository(SudtTokenInfoEntity)
      .createQueryBuilder('info')
      .leftJoinAndSelect('info.assetAccounts', 'aa')
      .where(
        `info.tokenID = :typeArgs AND aa.blake160 IN (select publicKeyInBlake160 from hd_public_key_info where walletId = :walletId)`,
        {
          typeArgs,
          walletId,
        }
      )
      .getOne()
  }
}
