import FileService from 'services/file'
import OutPoint from 'models/chain/out-point'
import { ScriptHashType } from 'models/chain/script'

const moduleName = 'cells'
const fileName = 'meta-info.json'

export interface SystemScript {
  codeHash: string
  outPoint: OutPoint
  hashType: ScriptHashType
}

export interface MetaInfo {
  genesisBlockHash: string
  systemScriptInfo: SystemScript
  daoScriptInfo: SystemScript
}

export const updateMetaInfo = (metaInfo: MetaInfo) => {
  FileService.getInstance().writeFileSync(moduleName, fileName, JSON.stringify(metaInfo))
}

export const getMetaInfo = (): MetaInfo => {
  const info = FileService.getInstance().readFileSync(moduleName, fileName)
  return JSON.parse(info)
}
