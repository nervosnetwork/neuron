import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveLiveCell1592781363749 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "live_cell"`, undefined);
    }

    public async down(_queryRunner: QueryRunner): Promise<any> {
    }
}
