import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../supabaseAdmin.js';

dotenv.config();

const router = express.Router();

/**
 * Route for handling Midtrans Webhook (Notification)
 * POST /api/webhooks/midtrans
 */
router.post('/midtrans', async (req, res) => {
  try {
    const notificationJson = req.body;
    
    // Midtrans sends notification. We need to verify its signature.
    // signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, payment_type, transaction_id } = notificationJson;
    
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'dummy_server_key';
    
    const hashString = order_id + status_code + gross_amount + serverKey;
    const generatedSignature = crypto.createHash('sha512').update(hashString).digest('hex');
    
    if (generatedSignature !== signature_key) {
      console.error('Invalid signature key from Midtrans');
      return res.status(401).json({ error: 'Invalid signature key' });
    }

    console.log(`Received verified notification for Order ID: ${order_id}, Status: ${transaction_status}`);

    // Determine the status of the transaction
    if (transaction_status == 'capture') {
      if (fraud_status == 'challenge') {
        // TODO: Handle challenge by FDS
        console.log('Transaction is challenged by FDS');
      } else if (fraud_status == 'accept') {
        // Success
        await processSuccessfulPurchase(order_id, payment_type, transaction_id);
      }
    } else if (transaction_status == 'settlement') {
      // Success
      await processSuccessfulPurchase(order_id, payment_type, transaction_id);
    } else if (transaction_status == 'cancel' || transaction_status == 'deny' || transaction_status == 'expire') {
      // Failed / Canceled
      await markTransactionFailed(order_id);
    } else if (transaction_status == 'pending') {
      // Pending
      console.log('Transaction is pending');
    }

    // Always respond 200 to Midtrans to acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error handling midtrans webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function processSuccessfulPurchase(transactionId, payment_type = 'midtrans', midtrans_txn_id = null) {
  try {
    // We can call the Supabase RPC "process_purchase" which takes the transaction_id
    const { data, error } = await supabaseAdmin.rpc('process_purchase', {
      p_transaction_id: transactionId,
      p_payment_method: payment_type,
      p_gateway: 'midtrans',
      p_gateway_txn_id: midtrans_txn_id
    });

    if (error) {
      console.error(`Failed to execute process_purchase for ${transactionId}:`, error);
      
      // Fallback: update status directly if RPC fails
      await supabaseAdmin.from('transactions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', transactionId);
    } else {
      console.log(`Successfully processed purchase for ${transactionId}`);
    }
  } catch (err) {
    console.error('Exception in processSuccessfulPurchase:', err);
  }
}

async function markTransactionFailed(transactionId) {
  try {
    const { error } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', transactionId);

    if (error) {
      console.error(`Failed to mark transaction ${transactionId} as failed:`, error);
    } else {
      console.log(`Transaction ${transactionId} marked as failed`);
    }
  } catch (err) {
    console.error('Exception in markTransactionFailed:', err);
  }
}

export default router;
