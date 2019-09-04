import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class extendBalance1562126909151 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE 'address' ADD COLUMN 'sentBalance' varchar NOT NULL DEFAULT '0';`)
      await queryRunner.query(`ALTER TABLE 'address' ADD COLUMN 'pendingBalance' varchar NOT NULL DEFAULT '0';`)

      await queryRunner.changeColumn('address', 'balance', new TableColumn({
        name: 'liveBalance',
        type: 'varchar',
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn('address', 'sentBalance')
      await queryRunner.dropColumn('address', 'pendingBalance')
      await queryRunner.changeColumn('address', 'liveBalance', new TableColumn({
        name: 'balance',
        type: 'varchar',
      }))
    }

}
