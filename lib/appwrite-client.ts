/**
 * Client-side Appwrite SDK configuration.
 *
 * This file initialises the **browser** SDK (`appwrite` package) which is used
 * for operations that require a user session on the client, such as email
 * verification via `account.createVerification()`.
 *
 * The *server* SDK (`node-appwrite`) lives in `./appwrite.ts` and is used in
 * API routes / server components only.
 */

import { Client, Account, ID } from 'appwrite';

// Suppress harmless Appwrite Realtime disconnect logs that happen naturally due to idle timeouts or Fast Refresh.
if (typeof console !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Realtime got disconnected')) {
      return;
    }
    originalConsoleError(...args);
  };
}

const client = new Client()
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    'https://nyc.cloud.appwrite.io/v1',
  )
  .setProject(
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  );

/** Browser-side Appwrite Account service */
export const account = new Account(client);

/** Re-export ID for convenience */
export { ID };

export default client;
