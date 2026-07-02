import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_KEY || '');

const databases = new Databases(client);

async function run() {
  try {
    const doc = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'auroric-db',
      'users',
      'user-1772350978581'
    );
    console.log('User still exists:', doc.$id);
    
    await databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'auroric-db',
      'users',
      'user-1772350978581'
    );
    console.log('Deleted successfully.');
  } catch (e: any) {
    console.log('User not found or deleted:', e.message);
  }
}
run();
