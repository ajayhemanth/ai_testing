import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service_account.json',
});

const bucketName = process.env.GCS_BUCKET_NAME || `${process.env.GCP_PROJECT_ID}-uploads`;
const bucket = storage.bucket(bucketName);

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadToGCS(
  fileBuffer: Buffer,
  filename: string,
  contentType?: string
): Promise<string> {
  const blob = bucket.file(filename);

  await blob.save(fileBuffer, {
    contentType: contentType || 'application/octet-stream',
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Make the file publicly readable (optional - remove if you want private files)
  await blob.makePublic();

  // Return the public URL
  return `https://storage.googleapis.com/${bucketName}/${filename}`;
}

/**
 * Download a file from Google Cloud Storage
 */
export async function downloadFromGCS(filename: string): Promise<Buffer> {
  const blob = bucket.file(filename);
  const [buffer] = await blob.download();
  return buffer;
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFromGCS(filename: string): Promise<void> {
  const blob = bucket.file(filename);
  await blob.delete();
}

/**
 * Check if a file exists in Google Cloud Storage
 */
export async function fileExistsInGCS(filename: string): Promise<boolean> {
  const blob = bucket.file(filename);
  const [exists] = await blob.exists();
  return exists;
}

/**
 * Get a signed URL for temporary access to a private file
 */
export async function getSignedUrl(
  filename: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const blob = bucket.file(filename);

  const [url] = await blob.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

/**
 * List files in a directory (prefix)
 */
export async function listFilesInGCS(prefix: string = ''): Promise<string[]> {
  const [files] = await bucket.getFiles({ prefix });
  return files.map(file => file.name);
}

/**
 * Create bucket if it doesn't exist
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    const [exists] = await bucket.exists();

    if (!exists) {
      await storage.createBucket(bucketName, {
        location: process.env.GCP_REGION || 'us-central1',
        storageClass: 'STANDARD',
      });
      console.log(`Bucket ${bucketName} created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

export { bucket, bucketName };
