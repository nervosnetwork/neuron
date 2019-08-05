import FileService from 'services/file'
import { SystemScript } from 'models/lock-utils'

const moduleName = 'cells'
const fileName = 'meta-info.json'

export interface MetaInfo {
  genesisBlockHash: string
  systemScriptInfo: SystemScript
}

export const updateMetaInfo = (metaInfo: MetaInfo) => {
  FileService.getInstance().writeFileSync(moduleName, fileName, JSON.stringify(metaInfo))
}

export const getMetaInfo = (): MetaInfo => {
  const info = FileService.getInstance().readFileSync(moduleName, fileName)
  return JSON.parse(info)
}
