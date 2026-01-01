import { MessageModel, MongoOrb, UserModel } from './main/orm.js';
import { getS3Key } from './main/shared/s3.js';
import { AttachmentUrl } from './models.js';

export const run = async () => {
  await attachmentsUrlChange();
};

type ModifiedMessageAttachments = Pick<MessageModel, 'attachmentsUrls' | '_id'>;

const attachmentsUrlChange = async () => {
  const users = await MongoOrb('UserCollection')
    .collection.find({})
    .project<Pick<UserModel, '_id'>>({ _id: 1 })
    .toArray();

  const usersIds = users.map((user) => user._id);

  const messageAttachments = await MongoOrb('MessageCollection')
    .collection.find({
      user: { $in: usersIds },
      attachmentsUrls: { $ne: [] },
    })
    .project<ModifiedMessageAttachments>({ attachmentsUrls: 1, _id: 1 })
    .toArray();

  const modifiedMessageAttachments = messageAttachments.map((message): ModifiedMessageAttachments => {
    return {
      _id: message._id,
      attachmentsUrls: message.attachmentsUrls
        ?.filter(
          (url) => url.image?.split('?').length === 2 || url.image?.split('digitaloceanspaces.com/').length !== 1,
        )
        .map(
          (url): AttachmentUrl => ({
            ...(url.image && { image: getS3Key(url.image) }),
            ...(url.image_thumbnail && { image_thumbnail: getS3Key(url.image_thumbnail) }),
          }),
        ),
    };
  });

  console.log('Found ', modifiedMessageAttachments.length, ' to change');

  let modifiedMessage = 0;
  for (const message of modifiedMessageAttachments) {
    const response = await MongoOrb('MessageCollection').collection.updateOne(
      { _id: message._id },
      {
        $set: {
          attachmentsUrls: message.attachmentsUrls,
        },
      },
    );
    console.log('Message ', message._id);

    modifiedMessage += response.matchedCount;
  }
  console.log(modifiedMessage, ' message modified');
};
