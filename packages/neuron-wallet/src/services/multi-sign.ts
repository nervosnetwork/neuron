import { getConnection } from 'typeorm'
import MultiSignConfig from 'database/chain/entities/multi-sign-config'
import { MultiSignConfigNotExistError, MultiSignConfigExistError } from 'exceptions/multi-sign'

export default class MultiSignService {
  async saveMultiSignConfig(multiSignConfig: MultiSignConfig) {
    const result = await getConnection()
      .getRepository(MultiSignConfig)
      .createQueryBuilder()
      .where({
        walletId: multiSignConfig.walletId,
        fullPayload: multiSignConfig.fullPayload
      })
      .getCount()
    if (result > 0) {
      throw new MultiSignConfigExistError()
    }
    return await getConnection().manager.save(multiSignConfig)
  }

  async updateMultiSignConfig(params: {
    id: string
    walletId?: string
    r?: number
    m?: number
    n?: number
    blake160s?: string[]
    alias?: string
    fullPayload?: string
  }) {
    const result = await getConnection()
      .getRepository(MultiSignConfig)
      .createQueryBuilder()
      .where({
        id: params.id
      })
      .getOne()
    if (!result) {
      throw new MultiSignConfigNotExistError()
    }
    await getConnection()
      .createQueryBuilder()
      .update(MultiSignConfig)
      .set({
        alias: params.alias ?? result.alias,
        walletId: params.walletId ?? result.walletId,
        r: params.r ?? result.r,
        m: params.m ?? result.m,
        n: params.n ?? result.n,
        blake160s: params.blake160s ?? result.blake160s,
        fullPayload: params.fullPayload ?? result.fullPayload
      })
      .where('id = :id', { id: params.id })
      .execute()
    return { ...result, ...params }
  }

  async getMultiSignConfig(walletId: string) {
    const result = await getConnection()
      .getRepository(MultiSignConfig)
      .createQueryBuilder()
      .where({
        walletId
      })
      .getMany()
    return result
  }
}
