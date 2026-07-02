import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // 1. Init admin SDK
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  // 2. Calculate expiry threshold
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  // 3. Paginate through ALL expired messages
  // Do not assume there are fewer than 100 — loop until exhausted
  let deleted = 0;
  let skipped = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    const batch = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MESSAGE_RELAY_COLLECTION_ID,
      [
        Query.lessThan('createdAt', twentyFourHoursAgo),
        Query.limit(limit),
        Query.offset(offset),
      ]
    );

    if (batch.documents.length === 0) break;

    for (const msg of batch.documents) {
      try {
        // 4. Check sender's premium status
        // TODO: Optimization - This is an N+1 query pattern. If message volumes scale,
        // we should batch fetch sender IDs, deduplicate, then check isPremium to reduce database calls.
        const sender = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION_ID,
          msg.senderId
        );

        if (sender.isPremium === true) {
          // Premium users: skip deletion
          skipped++;
          continue;
        }

        // Standard users: delete expired message
        await databases.deleteDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_MESSAGE_RELAY_COLLECTION_ID,
          msg.$id
        );
        deleted++;
      } catch (err) {
        error(`Failed to process message ${msg.$id} from sender ${msg.senderId}: ${err.message}`);
        // Continue to the next message rather than failing the whole job
      }
    }

    // If we got fewer than limit, we've reached the end
    if (batch.documents.length < limit) break;
    offset += limit;
  }

  log(`Reaper complete: ${deleted} deleted, ${skipped} skipped (premium)`);
  return res.json({ success: true, deleted, skipped });
};
