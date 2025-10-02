import express from 'express';
import WalletController from '../controllers/walletController.js';
import SubscriptionController from '../controllers/subscriptionController.js';
import PaymentController from '../controllers/paymentController.js';
import roleCheck from '../middleware/roleCheck.js';

const router = express.Router();

// Public payment routes (no role check for now as per your requirement)
router.post('/process', PaymentController.processPayment);
router.post('/refund', PaymentController.refundPayment);
router.post('/election-payment', PaymentController.processElectionPayment);
router.get('/transaction', PaymentController.getTransactionDetails);

// Admin-only routes (example of how to use roleCheck when needed)
// router.get('/revenue', roleCheck(['manager', 'admin', 'analyst']), PaymentController.getRevenue);
router.get('/revenue', PaymentController.getRevenue);

// Wallet routes
router.get('/wallet', WalletController.getWallet);
router.post('/wallet/deposit', WalletController.deposit);
router.post('/wallet/withdraw', WalletController.withdraw);
router.get('/wallet/transactions', WalletController.getTransactionHistory);

// Subscription routes
router.get('/subscriptions/plans', SubscriptionController.getPlans);
router.post('/subscriptions/subscribe', SubscriptionController.subscribe);
router.get('/subscriptions/user', SubscriptionController.getUserSubscription);
router.post('/subscriptions/cancel', SubscriptionController.cancelSubscription);

export default router;
// import express from 'express';
// import WalletController from '../controllers/walletController.js';
// import SubscriptionController from '../controllers/subscriptionController.js';

// const router = express.Router();

// // Wallet routes
// router.get('/wallet', WalletController.getWallet);
// router.post('/wallet/deposit', WalletController.deposit);
// router.post('/wallet/withdraw', WalletController.withdraw);
// router.get('/wallet/transactions', WalletController.getTransactionHistory);

// // Subscription routes
// router.get('/subscriptions/plans', SubscriptionController.getPlans);
// router.post('/subscriptions/subscribe', SubscriptionController.subscribe);
// router.get('/subscriptions/user', SubscriptionController.getUserSubscription);
// router.post('/subscriptions/cancel', SubscriptionController.cancelSubscription);

// export default router;