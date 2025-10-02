import SubscriptionModel from '../models/subscriptionModel.js';
import PaymentModel from '../models/paymentModel.js';

class SubscriptionController {
  static getSubscriptionPlans() {
    return {
      pay_as_you_go: { price: 0, duration: 0, name: 'Pay As You Go' },
      monthly: { price: 9.99, duration: 30, name: 'Monthly' },
      '3_month': { price: 24.99, duration: 90, name: '3 Months' },
      '6_month': { price: 44.99, duration: 180, name: '6 Months' },
      yearly: { price: 79.99, duration: 365, name: 'Yearly' }
    };
  }

  static async getPlans(req, res) {
    try {
      const plans = SubscriptionController.getSubscriptionPlans();
      res.json({
        success: true,
        plans
      });
    } catch (error) {
      console.error('Get plans error:', error);
      res.status(500).json({ error: 'Failed to retrieve plans' });
    }
  }

  static async subscribe(req, res) {
    try {
      const { userId, planType, paymentGateway = 'stripe', gatewayTransactionId } = req.body;

      if (!userId || !planType) {
        return res.status(400).json({ error: 'User ID and plan type are required' });
      }

      const plans = SubscriptionController.getSubscriptionPlans();
      const selectedPlan = plans[planType];

      if (!selectedPlan) {
        return res.status(400).json({ error: 'Invalid plan type' });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration);

      // Create subscription
      const subscription = await SubscriptionModel.createSubscription({
        userId,
        planType,
        amount: selectedPlan.price,
        startDate,
        endDate,
        paymentGateway,
        gatewaySubscriptionId: gatewayTransactionId
      });

      // Create payment transaction
      await PaymentModel.createTransaction({
        userId,
        transactionType: 'payment',
        amount: selectedPlan.price,
        paymentGateway,
        gatewayTransactionId,
        status: 'completed',
        description: `Subscription: ${selectedPlan.name}`,
        metadata: { subscriptionId: subscription.id }
      });

      res.json({
        success: true,
        message: 'Subscription activated',
        subscription
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      res.status(500).json({ error: 'Subscription failed' });
    }
  }

  static async getUserSubscription(req, res) {
    try {
      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const subscription = await SubscriptionModel.getUserSubscription(userId);

      res.json({
        success: true,
        subscription: subscription || null
      });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
  }

  static async cancelSubscription(req, res) {
    try {
      const { subscriptionId, userId } = req.body;

      if (!subscriptionId || !userId) {
        return res.status(400).json({ error: 'Subscription ID and User ID are required' });
      }

      const subscription = await SubscriptionModel.cancelSubscription(subscriptionId, userId);

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      res.json({
        success: true,
        message: 'Subscription cancelled',
        subscription
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
}

export default SubscriptionController;