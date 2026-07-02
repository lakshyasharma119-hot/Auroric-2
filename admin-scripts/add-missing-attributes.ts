import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_KEY || process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'auroric-db';

async function addMissingAttributes() {
  try {
    console.log('Adding aspectRatioId...');
    await databases.createStringAttribute(DB_ID, 'pins', 'aspectRatioId', 50, false, 'square_1_1');
    console.log('OK');
  } catch (e: any) {
    if (e.code === 409) console.log('Already exists');
    else console.error('Error:', e.message);
  }
  
  try {
    console.log('Adding engagementScore...');
    await databases.createFloatAttribute(DB_ID, 'pins', 'engagementScore', false, 0, 1000000000, 0);
    console.log('OK');
  } catch (e: any) {
    if (e.code === 409) console.log('Already exists');
    else console.error('Error:', e.message);
  }
}

addMissingAttributes();
