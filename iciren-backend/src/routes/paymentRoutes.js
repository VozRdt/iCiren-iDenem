import express from 'express';
import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../supabaseAdmin.js';

dotenv.config();

const router = express.Router();

// Initialize Snap API client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'dummy_server_key',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'dummy_client_key'
});

/**
 * Route to generate Midtrans Snap Token
 * POST /api/payment/token
 * Body: { transaction_id, amount, idea_title, customer_name, customer_email }
 */
router.post('/token', async (req, res) => {
  try {
    const { transaction_id, amount, idea_title, customer_name, customer_email } = req.body;

    if (!transaction_id || !amount) {
      return res.status(400).json({ error: 'Missing transaction_id or amount' });
    }

    // Optional: Verify that the transaction actually exists in Supabase
    // const { data: transaction, error: fetchError } = await supabaseAdmin
    //   .from('transactions')
    //   .select('*')
    //   .eq('id', transaction_id)
    //   .single();
    // if (fetchError || !transaction) {
    //   return res.status(404).json({ error: 'Transaction not found' });
    // }

    const parameter = {
      transaction_details: {
        order_id: transaction_id,
        gross_amount: amount
      },
      item_details: [{
        id: 'IDEA-' + Math.floor(Math.random() * 10000),
        price: amount,
        quantity: 1,
        name: idea_title || 'Ide Konten'
      }],
      customer_details: {
        first_name: customer_name || 'Customer',
        email: customer_email || 'customer@example.com'
      }
    };

    const tokenResponse = await snap.createTransaction(parameter);

    res.status(200).json({
      token: tokenResponse.token,
      redirect_url: tokenResponse.redirect_url
    });
  } catch (error) {
    console.error('Error generating Midtrans token:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
