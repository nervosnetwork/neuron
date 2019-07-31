import {MigrationInterface, QueryRunner, TableColumn, getConnection} from "typeorm";
import TransactionEntity from '../entities/transaction'
import { OutputStatus } from '../../../services/tx/params'
import { TransactionStatus } from '../../../types/cell-types'

export class AddStatusToTx1562038960990 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE 'transaction' ADD COLUMN 'status' varchar NOT NULL DEFAULT '';`)

      const txs = await getConnection()
        .getRepository(TransactionEntity)
        .find({ relations: ['inputs', 'outputs'] })
      const updatedTxs = txs.map(tx => {
        tx.status = tx.outputs[0].status === OutputStatus.Sent ? TransactionStatus.Pending : TransactionStatus.Success
        return tx
      })
      await getConnection().manager.save(updatedTxs)
      await queryRunner.changeColumn('transaction', 'status', new TableColumn({
        name: 'status',
        type: 'varchar',
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn('transaction', 'status')
    }

}
