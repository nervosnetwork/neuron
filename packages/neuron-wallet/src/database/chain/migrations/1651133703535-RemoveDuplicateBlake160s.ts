import { In, MigrationInterface, QueryRunner } from "typeorm";
import HdPublicKeyInfo from "../entities/hd-public-key-info";

export class RemoveDuplicateBlake160s1651133703535 implements MigrationInterface {
  name = 'RemoveDuplicateBlake160s1651133703535'

  public async up(queryRunner: QueryRunner): Promise<any> {
    const duplicateList = await queryRunner.connection
      .getRepository(HdPublicKeyInfo)
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .addSelect('group_concat(id) as ids')
      .groupBy('walletId')
      .addGroupBy('publicKeyInBlake160')
      .having('count > 1')
      .getRawMany()
    const deleteIds = duplicateList
      .map(
        (v: { ids: string }) => v.ids?.split(',')?.map((id: string) => Number(id.trim())).slice(1)
      )
      .flat()
    await queryRunner.connection
      .createQueryBuilder()
      .delete()
      .from(HdPublicKeyInfo)
      .where({
        id: In(deleteIds)
      })
      .execute()
  }

  public async down(): Promise<void> {
    // do nothing
  }

}
