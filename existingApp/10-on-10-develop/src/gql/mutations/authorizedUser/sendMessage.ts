import { $ } from "@/zeus"
import { typedGql } from "@/zeus/typedDocumentNode"

export const SEND_MESSAGE = typedGql("mutation")({
  users: {
    user: {
      channel: [
        { channelId: $("channelId", "String!") },
        { sendMessage: [{ message: $("message", "MessageInput!") }, true] },
      ],
    },
  },
})

export const UPLOAD_FILE_TO_CHANNEL = typedGql("mutation")({
  users: {
    user: {
      channel: [
        { channelId: $("channelId", "String!") },
        {
          uploadFile: [
            { key: $("key", "String!") },
            {
              putURL: true,
              getURL: true,
            },
          ],
        },
      ],
    },
  },
})
