import { In, MigrationInterface, QueryRunner } from 'typeorm'
import { utils } from '@ckb-lumos/lumos'
import { ScriptHashType } from '../../../models/chain/script'
import Output from '../entities/output'

export class UpdateOutputChequeLockHash1652945662504 implements MigrationInterface {
  name = 'UpdateOutputChequeLockHash1652945662504'

  public async up(queryRunner: QueryRunner): Promise<any> {
    const errLockHash = [
      utils.computeScriptHash({
        args: '0x' + '0'.repeat(80),
        codeHash: process.env.TESTNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType,
      }),
      utils.computeScriptHash({
        args: '0x' + '0'.repeat(80),
        codeHash: process.env.MAINNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType,
      }),
    ]
    const chequeOutput = await queryRunner.connection
      .getRepository(Output)
      .createQueryBuilder('output')
      .where({ lockHash: In(errLockHash) })
      .getMany()
    const updated = chequeOutput.map(output => {
      output.lockHash = utils.computeScriptHash({
        args: output.lockArgs,
        hashType: output.lockHashType,
        codeHash: output.lockCodeHash,
      })
      return output
    })
    await queryRunner.manager.save(updated)
  }

  public async down(): Promise<void> {
    // do nothing
  }
}
