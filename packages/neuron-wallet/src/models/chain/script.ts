import { Script } from '@ckb-lumos/base'
import HexUtils from '../../utils/hex'

// calculate bytelength of script, but without the header bytes of molecule encoding
// TODO: refactor me with @ckb-lumos/codec
export const calculateScriptBytesize = (script: Script): number => {
  return 1 + HexUtils.byteLength(script.codeHash) + HexUtils.byteLength(script.args)
}
