import { In, MigrationInterface, QueryRunner } from "typeorm";
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import Output from "../entities/output";
import { HashType } from "@ckb-lumos/base";

export class UpdateOutputChequeLockHash1652945662504 implements MigrationInterface {
  name = 'UpdateOutputChequeLockHash1652945662504'

  public async up(queryRunner: QueryRunner): Promise<any> {
    const errLockHash = [
      scriptToHash({
        args: '0x' + '0'.repeat(80),
        codeHash: process.env.TESTNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.TESTNET_CHEQUE_SCRIPT_HASHTYPE! as HashType
      }),
      scriptToHash({
        args: '0x' + '0'.repeat(80),
        codeHash: process.env.MAINNET_CHEQUE_SCRIPT_CODEHASH!,
        hashType: process.env.MAINNET_CHEQUE_SCRIPT_HASHTYPE! as HashType
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
