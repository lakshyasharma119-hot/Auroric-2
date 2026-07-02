import { Client, Databases, Users, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_KEY || '');

const databases = new Databases(client);
const users = new Users(client);

async function checkUser(email: string) {
  console.log(`\n--- Checking records for: ${email} ---\n`);

  // 1. Check Appwrite Auth
  try {
    const authUsers = await users.list([
      Query.equal('email', email)
    ]);
    if (authUsers.total > 0) {
      console.log('✅ Found in Appwrite Auth:');
      console.log(`   - Auth ID: ${authUsers.users[0].$id}`);
      console.log(`   - Name: ${authUsers.users[0].name}`);
      console.log(`   - Status: ${authUsers.users[0].status ? 'Active' : 'Blocked'}`);
    } else {
      console.log('❌ Not found in Appwrite Auth');
    }
  } catch (err: any) {
    console.error('Error checking Appwrite Auth:', err.message);
  }

  console.log(''); // spacer

  // 2. Check Database Collection
  try {
    const dbUsers = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'auroric-db',
      'users',
      [Query.equal('email', email)]
    );
    if (dbUsers.total > 0) {
      console.log('✅ Found in Database Collection:');
      console.log(`   - DB Doc ID: ${dbUsers.documents[0].$id}`);
      console.log(`   - Username: ${dbUsers.documents[0].username}`);
      console.log(`   - Display Name: ${dbUsers.documents[0].displayName}`);
    } else {
      console.log('❌ Not found in Database Collection');
    }
  } catch (err: any) {
    console.error('Error checking Database:', err.message);
  }
}

checkUser('testingforauroric2@gmail.com');
