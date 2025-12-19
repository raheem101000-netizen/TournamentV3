import { FromSelector, Selector } from "@/zeus"

export const ServerSelector = Selector("Server")({
  _id: true,
  title: true,
  iAmInterested: true,
  description: true,
  category: {
    slug: true,
    image: true,
    name: true,
    image_thumbnail: true,
  },
  host: {
    _id: true,
    username: true,
  },
  interestedUsers: {
    _id: true,
    username: true,
  },
})

export type ServerProps = FromSelector<typeof ServerSelector, "Server">

export const ServersByCategorySelector = Selector("Server")({
  _id: true,
  title: true,
  description: true,
  category: {
    slug: true,
    image: true,
    name: true,
    image_thumbnail: true,
  },
})

export type ServersByCategoryProps = FromSelector<typeof ServersByCategorySelector, "Server">
