import type { Connection, User } from "@prisma/client"
import type { ConnectionStateEnum } from "./enums/connection-state.enum"

export type Suggestion = {
  user: Partial<User>,
  connection?: Connection,
  connectionState: ConnectionStateEnum
}