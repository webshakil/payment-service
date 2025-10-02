import pool from '../config/database.js';

class WalletModel {
  static async createWallet(userId) {
    const query = `
      INSERT INTO vottery_wallets (user_id, balance)
      VALUES ($1, 0.00)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async getWalletByUserId(userId) {
    const query = 'SELECT * FROM vottery_wallets WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async updateBalance(userId, amount, operation = 'add') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const getQuery = 'SELECT balance FROM vottery_wallets WHERE user_id = $1 FOR UPDATE';
      const walletResult = await client.query(getQuery, [userId]);
      
      if (!walletResult.rows[0]) {
        throw new Error('Wallet not found');
      }
      
      const currentBalance = parseFloat(walletResult.rows[0].balance);
      let newBalance;
      
      if (operation === 'add') {
        newBalance = currentBalance + parseFloat(amount);
      } else if (operation === 'subtract') {
        if (currentBalance < parseFloat(amount)) {
          throw new Error('Insufficient balance');
        }
        newBalance = currentBalance - parseFloat(amount);
      }
      
      const updateQuery = `
        UPDATE vottery_wallets 
        SET balance = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = $2 
        RETURNING *
      `;
      const result = await client.query(updateQuery, [newBalance, userId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getTransactionHistory(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM vottery_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }
}

export default WalletModel;