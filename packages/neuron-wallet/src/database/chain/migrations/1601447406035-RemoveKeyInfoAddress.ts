import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveKeyInfoAddress1601447406035 implements MigrationInterface {
  name = 'RemoveKeyInfoAddress1601447406035'

  public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn(`hd_public_key_info`, 'address');
  }

  public async down(): Promise<any> {}

}
