import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMultisigOutput1649729996969 implements MigrationInterface {
    name = 'AddMultisigOutput1649729996969'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE "multisig_output" ("outPointTxHash" varchar NOT NULL, "outPointIndex" varchar NOT NULL, "outPointTxHashAddIndex" varchar NOT NULL, "capacity" varchar NOT NULL, "lockCodeHash" varchar NOT NULL, "lockArgs" varchar NOT NULL, "lockHashType" varchar NOT NULL, "lockHash" varchar NOT NULL, "status" varchar NOT NULL, PRIMARY KEY ("outPointTxHash", "outPointIndex"))`);
      await queryRunner.addColumns('multisig_config', [
        new TableColumn({
          name: 'lastestBlockNumber',
          type: 'varchar',
          isNullable: true,
        })
      ])
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "multisig_output"`)
      await queryRunner.dropColumns('multisig_config', [
        new TableColumn({
          name: 'lastestBlockNumber',
          type: 'varchar',
          isNullable: true,
        })
      ])
    }

}
