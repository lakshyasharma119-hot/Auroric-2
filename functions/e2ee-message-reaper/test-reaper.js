import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from the root of the project
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Inject required Appwrite Function environment variables
process.env.APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
process.env.APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '';
process.env.APPWRITE_API_KEY = process.env.APPWRITE_KEY || '';
process.env.APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'auroric-db';
process.env.APPWRITE_MESSAGE_RELAY_COLLECTION_ID = 'message_relay';
process.env.APPWRITE_USERS_COLLECTION_ID = 'users';

import main from './src/main.js';

console.log('--- Starting Reaper Test ---');

// Mock context objects
const context = {
    req: {},
    res: {
        json: (data) => {
            console.log('[res.json] Output:', data);
            return data;
        },
        send: (text) => {
            console.log('[res.send] Output:', text);
            return text;
        }
    },
    log: (msg) => console.log('[LOG]:', msg),
    error: (msg) => console.error('[ERROR]:', msg)
};

(async () => {
    try {
        await main(context);
        console.log('--- Reaper Test Complete ---');
    } catch (e) {
        console.error('Fatal error during test:', e);
    }
})();
