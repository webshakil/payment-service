import WalletModel from '../models/walletModel.js';
import PaymentModel from '../models/paymentModel.js';

class WalletController {
  static async getWallet(req, res) {
    try {
      const userId = req.query.userId || req.body.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      let wallet = await WalletModel.getWalletByUserId(userId);

      if (!wallet) {
        wallet = await WalletModel.createWallet(userId);
      }

      res.json({
        success: true,
        wallet
      });
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({ error: 'Failed to retrieve wallet' });
    }
  }

  static async deposit(req, res) {
    try {
      const { userId, amount, paymentGateway = 'stripe', gatewayTransactionId } = req.body;

      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid deposit data' });
      }

      // Create transaction record
      const transaction = await PaymentModel.createTransaction({
        userId,
        transactionType: 'deposit',
        amount,
        paymentGateway,
        gatewayTransactionId,
        status: 'completed',
        description: 'Wallet deposit'
      });

      // Update wallet balance
      const wallet = await WalletModel.updateBalance(userId, amount, 'add');

      res.json({
        success: true,
        message: 'Deposit successful',
        transaction,
        wallet
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({ error: 'Deposit failed' });
    }
  }

  static async withdraw(req, res) {
    try {
      const { userId, amount } = req.body;

      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid withdrawal data' });
      }

      // Create transaction record
      const transaction = await PaymentModel.createTransaction({
        userId,
        transactionType: 'withdrawal',
        amount,
        status: 'pending',
        description: 'Wallet withdrawal'
      });

      // Update wallet balance
      const wallet = await WalletModel.updateBalance(userId, amount, 'subtract');

      res.json({
        success: true,
        message: 'Withdrawal request submitted',
        transaction,
        wallet
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({ 
        error: error.message === 'Insufficient balance' 
          ? 'Insufficient balance' 
          : 'Withdrawal failed' 
      });
    }
  }

  static async getTransactionHistory(req, res) {
    try {
      const userId = req.query.userId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const transactions = await WalletModel.getTransactionHistory(userId, limit, offset);

      res.json({
        success: true,
        transactions,
        pagination: {
          limit,
          offset,
          total: transactions.length
        }
      });
    } catch (error) {
      console.error('Transaction history error:', error);
      res.status(500).json({ error: 'Failed to retrieve transaction history' });
    }
  }
}

export default WalletController;