import { MigrationInterface, QueryRunner } from "typeorm";
import SystemScriptInfo from "../../../models/system-script-info";

export class AddLockCodeHash1744960856059 implements MigrationInterface {
    name = 'AddLockCodeHash1744960856059'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "multisig_config" ADD COLUMN "lockCodeHash" varchar`)
      await queryRunner.query(`UPDATE "multisig_config" SET lockCodeHash = "${SystemScriptInfo.LEGACY_MULTISIG_CODE_HASH}" where lockCodeHash IS NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "multisig_config" DROP COLUMN "lockCodeHash";`)
    }
}

export async function checkLockCodeHash(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`UPDATE "multisig_config" SET lockCodeHash = "${SystemScriptInfo.LEGACY_MULTISIG_CODE_HASH}" where lockCodeHash IS NULL`)
}
