import { AttachmentUrl } from '../models.js';
import { uploadThumbnailAndGetUrl } from '../shared/s3.js';

export const generateAttachmentsUrls = async (images?: string[]): Promise<AttachmentUrl[]> => {
  return Promise.all(
    (images ?? [])?.map(async (imageUrl) => {
      const image_thumbnail = await uploadThumbnailAndGetUrl(imageUrl);

      return {
        image: imageUrl,
        image_thumbnail,
      };
    }),
  );
};
