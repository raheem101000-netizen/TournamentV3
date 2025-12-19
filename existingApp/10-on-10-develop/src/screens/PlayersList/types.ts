import { ServerByIdProps } from "@/gql"

export type PlayerItemProps = NonNullable<ServerByIdProps["interestedUsers"]>[0]
