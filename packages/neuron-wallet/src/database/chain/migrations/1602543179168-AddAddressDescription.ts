import {MigrationInterface, QueryRunner} from "typeorm";
import fs from "fs";
import env from "env";
import path from "path";
import NetworksService from "services/networks";
import AddressMeta from "database/address/meta";

export class AddAddressDescription1602543179168 implements MigrationInterface {
    name = 'AddAddressDescription1602543179168'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "address_description" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "address" varchar NOT NULL, "description" varchar NOT NULL)`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_eb54f769e9f6d23d51b8d02d1d" ON "address_description" ("walletId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_bc3931239490edba9ad200ce29" ON "address_description" ("address") `, undefined);

        await queryRunner.dropColumn(`hd_public_key_info`, 'description');

        //migration from the legacy address json store
        const fileBasePath = env.fileBasePath
        const legacyAddressPath = path.join(fileBasePath, 'addresses/index.json')

        if (!fs.existsSync(legacyAddressPath)) {
          return
        }

        const json = fs.readFileSync(legacyAddressPath, {encoding: 'utf8'})
        const {addresses} = JSON.parse(json)

        const currentChain = NetworksService.getInstance().getCurrent().chain

        let addressesByNetwork = []
        if (currentChain === 'ckb') {
          addressesByNetwork = addresses.filter((addr:AddressMeta) => addr.version === 'mainnet' && addr.description)
        }
        else {
          addressesByNetwork = addresses.filter((addr:AddressMeta) => addr.version !== 'mainnet' && addr.description)
        }
        for (const {walletId, address, description} of addressesByNetwork) {
          await queryRunner.query(`INSERT INTO "address_description" ("walletId", "address", "description") values('${walletId}', '${address}', '${description}')`, undefined);
        }
    }

    public async down(): Promise<any> {}

}
