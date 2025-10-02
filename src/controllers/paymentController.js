import PaymentModel from '../models/paymentModel.js';
import WalletModel from '../models/walletModel.js';

class PaymentController {
  static async processPayment(req, res) {
    try {
      const {
        userId,
        amount,
        paymentGateway = 'stripe',
        gatewayTransactionId,
        description,
        metadata
      } = req.body;

      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid payment data' });
      }

      // Create transaction
      const transaction = await PaymentModel.createTransaction({
        userId,
        transactionType: 'payment',
        amount,
        paymentGateway,
        gatewayTransactionId,
        status: 'pending',
        description: description || 'Payment',
        metadata
      });

      // Simulate payment processing
      // In production, integrate with Stripe/Paddle API here
      const paymentSuccess = true; // Simulate success

      if (paymentSuccess) {
        await PaymentModel.updateTransactionStatus(transaction.id, 'completed');
        
        res.json({
          success: true,
          message: 'Payment processed successfully',
          transactionId: transaction.id
        });
      } else {
        await PaymentModel.updateTransactionStatus(transaction.id, 'failed');
        
        res.status(400).json({
          success: false,
          error: 'Payment failed'
        });
      }
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  }

  static async refundPayment(req, res) {
    try {
      const { transactionId, userId, reason } = req.body;

      if (!transactionId || !userId) {
        return res.status(400).json({ error: 'Transaction ID and User ID are required' });
      }

      // Get original transaction
      const originalTransaction = await PaymentModel.getTransactionById(transactionId);

      if (!originalTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (originalTransaction.user_id !== parseInt(userId)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (originalTransaction.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed transactions can be refunded' });
      }

      // Create refund transaction
      const refundTransaction = await PaymentModel.createTransaction({
        userId,
        transactionType: 'refund',
        amount: originalTransaction.amount,
        paymentGateway: originalTransaction.payment_gateway,
        status: 'completed',
        description: `Refund for transaction #${transactionId}`,
        metadata: { originalTransactionId: transactionId, reason }
      });

      // Update original transaction status
      await PaymentModel.updateTransactionStatus(transactionId, 'refunded');

      // Update wallet balance
      await WalletModel.updateBalance(userId, originalTransaction.amount, 'add');

      res.json({
        success: true,
        message: 'Refund processed successfully',
        refundTransaction
      });
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({ error: 'Refund processing failed' });
    }
  }

  static async getTransactionDetails(req, res) {
    try {
      const transactionId = req.query.transactionId;

      if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      const transaction = await PaymentModel.getTransactionById(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        success: true,
        transaction
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Failed to retrieve transaction' });
    }
  }

  static async getRevenue(req, res) {
    try {
      const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate || new Date();

      const revenue = await PaymentModel.getRevenue(startDate, endDate);

      const summary = {
        total: 0,
        byType: {}
      };

      revenue.forEach(item => {
        const amount = parseFloat(item.total_revenue) || 0;
        summary.total += amount;
        summary.byType[item.transaction_type] = {
          amount,
          count: parseInt(item.transaction_count)
        };
      });

      res.json({
        success: true,
        summary,
        details: revenue,
        period: {
          startDate,
          endDate
        }
      });
    } catch (error) {
      console.error('Get revenue error:', error);
      res.status(500).json({ error: 'Failed to retrieve revenue data' });
    }
  }

  static async processElectionPayment(req, res) {
    try {
      const {
        userId,
        electionId,
        amount,
        paymentGateway = 'stripe',
        gatewayTransactionId
      } = req.body;

      if (!userId || !electionId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid payment data' });
      }

      // Create transaction
      const transaction = await PaymentModel.createTransaction({
        userId,
        transactionType: 'payment',
        amount,
        paymentGateway,
        gatewayTransactionId,
        status: 'completed',
        description: `Election participation fee - Election #${electionId}`,
        metadata: { electionId }
      });

      res.json({
        success: true,
        message: 'Election payment processed successfully',
        transaction
      });
    } catch (error) {
      console.error('Election payment error:', error);
      res.status(500).json({ error: 'Election payment failed' });
    }
  }
}

export default PaymentController;