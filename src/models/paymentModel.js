import pool from '../config/database.js';

class PaymentModel {
  static async createTransaction(data) {
    const {
      userId,
      transactionType,
      amount,
      currency = 'USD',
      paymentGateway,
      gatewayTransactionId,
      status = 'pending',
      description,
      metadata
    } = data;

    const query = `
      INSERT INTO vottery_transactions (
        user_id, transaction_type, amount, currency, 
        payment_gateway, gateway_transaction_id, status, 
        description, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userId, transactionType, amount, currency,
      paymentGateway, gatewayTransactionId, status,
      description, JSON.stringify(metadata)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateTransactionStatus(transactionId, status) {
    const query = `
      UPDATE vottery_transactions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [status, transactionId]);
    return result.rows[0];
  }

  static async getTransactionById(transactionId) {
    const query = 'SELECT * FROM vottery_transactions WHERE id = $1';
    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  }

  static async getUserTransactions(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM vottery_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getRevenue(startDate, endDate) {
    const query = `
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count,
        transaction_type
      FROM vottery_transactions
      WHERE status = 'completed'
        AND created_at BETWEEN $1 AND $2
      GROUP BY transaction_type
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}

export default PaymentModel;