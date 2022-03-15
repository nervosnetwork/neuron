import { getConnection } from 'typeorm'
import MultisigConfig from 'database/chain/entities/multisig-config'
import { MultisigConfigNotExistError, MultisigConfigExistError } from 'exceptions/multisig'

export default class MultisigService {
  async saveMultisigConfig(multisigConfig: MultisigConfig) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        walletId: multisigConfig.walletId,
        fullPayload: multisigConfig.fullPayload
      })
      .getCount()
    if (result > 0) {
      throw new MultisigConfigExistError()
    }
    return await getConnection().manager.save(multisigConfig)
  }

  async updateMultisigConfig(params: {
    id: number
    walletId?: string
    r?: number
    m?: number
    n?: number
    addresses?: string[]
    alias?: string
    fullPayload?: string
  }) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        id: params.id
      })
      .getOne()
    if (!result) {
      throw new MultisigConfigNotExistError()
    }
    await getConnection()
      .createQueryBuilder()
      .update(MultisigConfig)
      .set({
        alias: params.alias ?? result.alias,
        walletId: params.walletId ?? result.walletId,
        r: params.r ?? result.r,
        m: params.m ?? result.m,
        n: params.n ?? result.n,
        addresses: params.addresses ?? result.addresses,
        fullPayload: params.fullPayload ?? result.fullPayload
      })
      .where('id = :id', { id: params.id })
      .execute()
    return { ...result, ...params }
  }

  async getMultisigConfig(walletId: string) {
    const result = await getConnection()
      .getRepository(MultisigConfig)
      .createQueryBuilder()
      .where({
        walletId
      })
      .getMany()
    return result
  }

  async deleteConfig(id: number) {
    await getConnection()
      .createQueryBuilder()
      .delete()
      .from(MultisigConfig)
      .where('id = :id', { id })
      .execute()
  }
}
