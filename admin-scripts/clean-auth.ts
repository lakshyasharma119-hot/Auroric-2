import { Client, Users } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_KEY || '');

const users = new Users(client);

async function clean() {
  try {
    const list = await users.list();
    const targetUser = list.users.find(u => u.email === 'testingforauroric2@gmail.com');
    if (targetUser) {
      await users.delete(targetUser.$id);
      console.log('Successfully cleaned up user from Auth:', targetUser.$id);
    } else {
      console.log('User testingforauroric2@gmail.com not found in Auth.');
    }
  } catch (e: any) {
    console.error('Error cleaning up auth:', e.message);
  }
}
clean();
