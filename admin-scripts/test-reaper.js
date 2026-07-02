const { Client, Databases, Query } = require('node-appwrite');
try {
  require('dotenv').config({ path: '.env' });
} catch (e) {}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || '');

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'auroric-db';

async function run() {
    console.log("Starting Reaper Script...");
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`Checking for messages older than ${twentyFourHoursAgo}`);
    
    try {
        const { documents: messages } = await databases.listDocuments(
            DB_ID,
            'message_relay',
            [Query.lessThan('createdAt', twentyFourHoursAgo)]
        );
        console.log(`Found ${messages.length} old messages.`);

        for (const msg of messages) {
            let isPremium = false;
            try {
                const sender = await databases.getDocument(DB_ID, 'users', msg.senderId);
                if (sender.isPremium === true) {
                    isPremium = true;
                }
            } catch (err) {
                console.log(`Could not fetch sender ${msg.senderId}, assuming not premium. Error: ${err.message}`);
            }

            if (isPremium) {
                console.log(`Skipping message ${msg.$id}, sender ${msg.senderId} is premium`);
            } else {
                await databases.deleteDocument(DB_ID, 'message_relay', msg.$id);
                console.log(`Deleted message ${msg.$id}`);
            }
        }
        console.log("Reaper script finished.");
    } catch (err) {
        console.error("Error executing Reaper script:", err);
    }
}
run();
