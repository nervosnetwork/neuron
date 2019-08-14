import {MigrationInterface, QueryRunner, TableColumn, getConnection, In} from "typeorm";
import TransactionEntity from '../entities/transaction'
import { OutputStatus } from '../../../services/tx/params'
import { TransactionStatus } from '../../../types/cell-types'
import OutputEntity from 'database/chain/entities/output'

export class AddStatusToTx1562038960990 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      // TransactionStatus.Success = 'success'
      await queryRunner.query(`ALTER TABLE 'transaction' ADD COLUMN 'status' varchar NOT NULL DEFAULT 'success';`)

      const pendingTxHashes: string[] = (await getConnection()
        .getRepository(OutputEntity)
        .createQueryBuilder('output')
        .select(`output.outPointTxHash`, 'txHash')
        .where({
          status: OutputStatus.Sent
        })
        .getRawMany())
        .filter(output => output.txHash)
      await getConnection()
        .createQueryBuilder()
        .update(TransactionEntity)
        .set({ status: TransactionStatus.Pending })
        .where({
          hash: In(pendingTxHashes)
        })
        .execute()

      await queryRunner.changeColumn('transaction', 'status', new TableColumn({
        name: 'status',
        type: 'varchar',
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn('transaction', 'status')
    }

}
