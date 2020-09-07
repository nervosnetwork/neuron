import {MigrationInterface, QueryRunner } from "typeorm";
import env from "env";

export class TxDescription1599441769473 implements MigrationInterface {
  name = 'TxDescription1599441769473'

  public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE "tx_description" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "txHash" varchar NOT NULL, "description" varchar NOT NULL)`, undefined);
      await queryRunner.query(`CREATE INDEX "IDX_723cdd2978f3288000c33bdcc5" ON "tx_description" ("txHash") `, undefined);

      //the following leveldb migration code will be deprecated and removed in next minor version 0.34
      if (env.isTestMode) {
        return
      }
      const maindb = require('../../leveldb').maindb

      const itemsToMigrate: any[] = await new Promise(resolve => {
        const itemsToMigrate: any = []
        maindb.createReadStream()
          .on('data', function (data: { key: any; value: any; }) {
            try {
              const keys = data.key.toString('utf8').split(':')
              const [, walletId, txHash] = keys
              itemsToMigrate.push([walletId, txHash, data.value.toString('utf8')])
            } catch (error) {
              console.error(error)
            }
          })
          .on('error', function () {
            resolve(itemsToMigrate)
          })
          .on('close', function () {
            resolve(itemsToMigrate)
          })
          .on('end', function () {
            resolve(itemsToMigrate)
          })
      })

      for (const [walletId, txHash, description] of itemsToMigrate) {
        await queryRunner.query(`INSERT INTO "tx_description" ("walletId", "txHash", "description") values('${walletId}', '${txHash}', '${description}')`, undefined);

      }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "tx_description"`, undefined);
    }

}
