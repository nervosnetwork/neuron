import fs from 'fs'
import path from 'path'
import IndexerFolderManager from "../../src/block-sync-renderer/sync/indexer-folder-manager";

const deleteFolderRecursive = (pathToRemove: string) => {
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

describe('#IndexerFolderManager', () => {
  describe('#IndexerDataFolderPath', () => {
    it('generates folder path based on current env', () => {
      let expectPathRegex
      if (process.platform === 'win32') {
        expectPathRegex = expect.stringMatching(/test\\indexer_data/)
      }
      else {
        expectPathRegex = expect.stringMatching(/test\/indexer_data/)
      }

      expect(IndexerFolderManager.IndexerDataFolderPath).toEqual(expectPathRegex)
    })
  });
  describe('#resetIndexerData', () => {
    describe('when there is a folder with sub folders inside', () => {
      const folderPath = IndexerFolderManager.IndexerDataFolderPath
      const subfolderPath = path.join(folderPath, 'subfolder')
      beforeEach(() => {
        fs.mkdirSync(subfolderPath, { recursive: true });
      })
      afterEach(() => {
        deleteFolderRecursive(folderPath)
      });
      it('sub folder exists', () => {
        const exists = fs.existsSync(subfolderPath)
        expect(exists).toBeTruthy()
      });
      describe('when reset indexer data', () => {
        beforeEach(() => {
          IndexerFolderManager.resetIndexerData()
        });
        it('removes indexer data folder', () => {
          const exists = fs.existsSync(folderPath)
          expect(exists).toEqual(false)
        })
      });
    });
  });
});
