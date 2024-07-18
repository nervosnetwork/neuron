import { In, MigrationInterface, QueryRunner } from "typeorm";
import { computeScriptHash as scriptToHash } from '@ckb-lumos/lumos/utils'
import { ScriptHashType } from "../../../models/chain/script";
import Output from "../entities/output";



export class UpdateOutputChequeLockHash1652945662504 implements MigrationInterface {
  name = 'UpdateOutputChequeLockHash1652945662504'

  public async up(queryRunner: QueryRunner): Promise<any> {
    const errLockHash = [
      scriptToHash({
        args: '0x' + '0'.repeat(80),
        codeHash: process.env.TESTNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType
      }),
      scriptToHash({
        args: '0x' + '0'.repeat(80),
        codeHash: process.env.MAINNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_CHEQUE_SCRIPT_HASHTYPE! as ScriptHashType
      })
    ]
    const chequeOutput = await queryRunner.connection
      .getRepository(Output)
      .createQueryBuilder('output')
      .where({ lockHash: In(errLockHash) })
      .getMany()
    const updated = chequeOutput.map(output => {
      output.lockHash = scriptToHash({
        args: output.lockArgs,
        hashType: output.lockHashType,
        codeHash: output.lockCodeHash
      })
      return output
    })
    await queryRunner.manager.save(updated)
  }

  public async down(): Promise<void> {
    // do nothing
  }

}
