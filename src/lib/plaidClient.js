// lib/plaidClient.js
// Centralised Plaid client helper to share configuration, retries, and caching.
// This follows the same singleton pattern used in `lib/mongodb.js` so that
// the Plaid SDK only initialises once per serverless cold start.

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

let cachedClient;

export default function getPlaidClient() {
  if (cachedClient) return cachedClient;

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error('PLAID_CLIENT_ID and PLAID_SECRET environment variables are required');
  }

  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });

  cachedClient = new PlaidApi(config);
  return cachedClient;
}
