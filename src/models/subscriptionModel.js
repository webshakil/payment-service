import pool from '../config/database.js';

class SubscriptionModel {
  static async createSubscription(data) {
    const {
      userId,
      planType,
      amount,
      currency = 'USD',
      startDate,
      endDate,
      paymentGateway,
      gatewaySubscriptionId
    } = data;

    const query = `
      INSERT INTO vottery_subscriptions (
        user_id, plan_type, status, amount, currency,
        start_date, end_date, payment_gateway, gateway_subscription_id
      )
      VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userId, planType, amount, currency,
      startDate, endDate, paymentGateway, gatewaySubscriptionId
    ];

    const result = await pool.query(query, values);
    
    // Update user subscription status
    await pool.query(`
      UPDATE vottery_users 
      SET subscription_status = 'subscribed', 
          subscription_plan = $1,
          subscription_expires_at = $2
      WHERE id = $3
    `, [planType, endDate, userId]);

    return result.rows[0];
  }

  static async getUserSubscription(userId) {
    const query = `
      SELECT * FROM vottery_subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async cancelSubscription(subscriptionId, userId) {
    const query = `
      UPDATE vottery_subscriptions 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND user_id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [subscriptionId, userId]);
    
    if (result.rows[0]) {
      await pool.query(`
        UPDATE vottery_users 
        SET subscription_status = 'free', subscription_plan = NULL
        WHERE id = $1
      `, [userId]);
    }

    return result.rows[0];
  }

  static async checkExpiredSubscriptions() {
    const query = `
      UPDATE vottery_subscriptions 
      SET status = 'expired' 
      WHERE end_date < CURRENT_TIMESTAMP AND status = 'active'
      RETURNING user_id
    `;
    const result = await pool.query(query);
    
    // Update user subscription status for expired subscriptions
    for (const row of result.rows) {
      await pool.query(`
        UPDATE vottery_users 
        SET subscription_status = 'free', subscription_plan = NULL
        WHERE id = $1
      `, [row.user_id]);
    }

    return result.rows;
  }
}

export default SubscriptionModel;