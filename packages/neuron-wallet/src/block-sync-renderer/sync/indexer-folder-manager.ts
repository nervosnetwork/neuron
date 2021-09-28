import fs from 'fs'
import env from 'env'
import path from 'path'
import NetworksService from 'services/networks'

export default class IndexerFolderManager {
  public static get IndexerDataFolderPath () {
    const lumosIndexerDBFolder = 'indexer_data'
    const genesisBlockHash = NetworksService.getInstance().getCurrent().genesisHash
    const indexedDataFolderPath = path.resolve(
      env.fileBasePath,
      lumosIndexerDBFolder,
      genesisBlockHash
    )

    return indexedDataFolderPath
  }

  public static resetIndexerData() {
    deleteFolderRecursive(this.IndexerDataFolderPath)
  }
}

export const deleteFolderRecursive = (pathToRemove: string) => {
  if (fs.existsSync(pathToRemove)) {
    fs.readdirSync(pathToRemove).forEach(file => {
      const curPath = path.join(pathToRemove, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    });
    fs.rmdirSync(pathToRemove)
  }
}
