import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateCellLocalInfo1694228328076 implements MigrationInterface {
    name = 'CreateCellLocalInfo1694228328076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cell_local_info" ("outPoint" varchar PRIMARY KEY NOT NULL, "locked" boolean NOT NULL DEFAULT false, "description" varchar)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "cell_local_info"`);
    }

}
