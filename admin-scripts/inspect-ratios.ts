import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { Client, Databases } from 'node-appwrite';
import https from 'https';
import sizeOf from 'image-size';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_KEY || process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'auroric-db';

async function getImageBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data: Buffer[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function inspectPins() {
  try {
    const res = await databases.listDocuments(DB_ID, 'pins');
    // Get the first 4 pins to check
    const pinsToCheck = res.documents.slice(0, 4);

    for (const pin of pinsToCheck) {
      console.log(`\n--- Pin: ${pin.title} (${pin.$id}) ---`);
      console.log(`Stored aspectRatioId: ${pin.aspectRatioId}`);
      try {
        const buffer = await getImageBuffer(pin.imageUrl);
        const dimensions = sizeOf(buffer);
        console.log(`Actual Image Dimensions: ${dimensions.width}x${dimensions.height}`);
        if (dimensions.width && dimensions.height) {
          const ratio = (dimensions.width / dimensions.height).toFixed(2);
          console.log(`Actual Ratio W/H: ${ratio}`);
        }
      } catch (err: any) {
        console.log(`Could not fetch/measure image: ${err.message}`);
      }
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

inspectPins();
