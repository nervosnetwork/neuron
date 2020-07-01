import Script from "models/chain/script";
import { queryIndexer } from 'block-sync-renderer/index'
import { LumosCellQuery, LumosCell } from "block-sync-renderer/sync/indexer-connector";

export default class IndexerService {
  private static instance: IndexerService;

  public static getInstance = () => {
    if (!IndexerService.instance) {
      IndexerService.instance = new IndexerService()
    }

    return IndexerService.instance
  }

  constructor() {}

  public async getLiveCellsByScript(lock: Script | null, type: Script | null, data: string | null): Promise<LumosCell[]> {
    if (!lock && !type) {
      throw new Error('at least one parameter is required')
    }

    const query: LumosCellQuery = {lock, type, data}
    const liveCells: LumosCell[] = await queryIndexer(query)
    return liveCells
  }
}
