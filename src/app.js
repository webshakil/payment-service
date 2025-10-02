import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Payment Service is running' });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});

export default app;