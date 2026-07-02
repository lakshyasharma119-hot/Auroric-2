import dotenv from 'dotenv';
import { Client, Databases } from 'node-appwrite';

dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkRelay() {
  const { total } = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'auroric-db',
    'message_relay'
  );
  console.log('Total messages in message_relay:', total);
}

checkRelay().catch(console.error);
