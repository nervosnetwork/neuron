import {MigrationInterface, QueryRunner} from "typeorm";

export class AddConfirmed1565693320664 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE 'transaction' ADD COLUMN 'confirmed' boolean NOT NULL DEFAULT false;`)
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('transaction', 'confirmed')
  }

}
