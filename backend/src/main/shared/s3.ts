import { getEnv } from '@/src/env.js';
import { PutObjectCommand, S3, ListObjectsCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

const s3Client = new S3({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: getEnv('S3_ORIGIN_ENDPOINT'),
  region: getEnv('S3_REGION'),
  credentials: {
    accessKeyId: getEnv('S3_ACCESS'),
    secretAccessKey: getEnv('S3_SECRET'),
  },
});

export const getGETUrl = (key: string) => {
  const command = new GetObjectCommand({
    Bucket: getEnv('S3_BUCKET'),
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const getPutURL = (key: string) => {
  const command = new PutObjectCommand({
    Bucket: getEnv('S3_BUCKET'),
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const listKeys = async (prefix?: string) => {
  const command = new ListObjectsCommand({
    Bucket: getEnv('S3_BUCKET'),
    Prefix: prefix,
  });
  const response = await s3Client.send(command);
  return response.Contents?.map((content) => content.Key);
};

export const deleteKeys = async (keys: string[]) => {
  const command = new DeleteObjectsCommand({
    Bucket: getEnv('S3_BUCKET'),
    Delete: {
      Objects: keys.map((k) => ({
        Key: k,
      })),
    },
  });
  const response = await s3Client.send(command);
  return response.Deleted;
};

export const getS3Key = (imageUrl: string) => {
  const newUrl = new URL(imageUrl);
  return decodeURIComponent(newUrl.pathname.replace(/^\/|\/$/g, ''));
};

const getAndResizeImage = async (imageFileKey: string): Promise<Buffer> => {
  const command = new GetObjectCommand({
    Bucket: getEnv('S3_BUCKET'),
    Key: imageFileKey,
  });

  const response = await s3Client.send(command);
  const body = await response.Body?.transformToByteArray();

  return sharp(body).resize(200).toFormat('jpeg').toBuffer();
};

export const uploadThumbnailAndGetUrl = async (imageUrl: string): Promise<string> => {
  const s3Key = getS3Key(imageUrl);
  const buffer = await getAndResizeImage(s3Key);

  const thumbnailKey = s3Key.replace('image', 'thumbnail');
  await s3Client.send(
    new PutObjectCommand({
      Bucket: getEnv('S3_BUCKET'),
      Key: thumbnailKey,
      Body: buffer,
      ContentType: 'image/jpeg',
    }),
  );

  return await getGETUrl(thumbnailKey);
};
