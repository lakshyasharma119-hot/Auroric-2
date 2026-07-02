import { Client, Databases, Users } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_KEY || '');

const databases = new Databases(client);
const users = new Users(client);

async function verifyUser() {
  try {
    const list = await users.list();
    const targetUser = list.users.find(u => u.email === 'testingforauroric2@gmail.com');
    if (targetUser) {
      // 1. Update in Auth (if supported, Appwrite updateEmailVerification status)
      await users.updateEmailVerification(targetUser.$id, true);
      console.log('Marked email as verified in Auth layer.');
    } else {
      console.log('User not found in Auth.');
    }

    // 2. Update in DB
    const dbUsers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'auroric-db',
      'users'
    );
    const targetDbUser = dbUsers.documents.find(d => d.email === 'testingforauroric2@gmail.com');
    if (targetDbUser) {
      await databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'auroric-db',
        'users',
        targetDbUser.$id,
        {
          emailVerified: true
        }
      );
      console.log('Marked email as verified in Database layer.');
    } else {
      console.log('User not found in Database.');
    }
  } catch (e: any) {
    console.error('Error verifying user:', e.message);
  }
}
verifyUser();
