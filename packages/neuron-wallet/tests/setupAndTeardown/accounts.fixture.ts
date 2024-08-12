import AssetAccount from '../../src/models/asset-account'
import { UDTType } from '../../src/utils/const'
import { DEPLOY_KEY } from './keys'

const ASSET_ACCOUNT = {
  tokenID: '0xe2193df51d78411601796b35b17b4f8f2cd85bd0',
  symbol: 'symbol',
  tokenName: 'tokenName',
  decimal: '0',
  balance: '0',
  accountName: 'SUDT Account',
  blake160: DEPLOY_KEY.blake160,
  udtType: UDTType.SUDT,
}

const CKB_ASSET_ACCOUNT = {
  tokenID: 'CKBytes',
  symbol: 'CKB',
  tokenName: 'CKBytes',
  decimal: '8',
  balance: '0',
  accountName: 'CKB Account',
  blake160: DEPLOY_KEY.blake160,
}

export default [ASSET_ACCOUNT, CKB_ASSET_ACCOUNT].map(acc => AssetAccount.fromObject(acc))
