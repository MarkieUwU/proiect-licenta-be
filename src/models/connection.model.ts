import type { Connection, User } from "@prisma/client"

export type UserConnection = {
  user: Partial<User>;
  userId: number;
  pending: boolean;
  connection: Connection | null
}

export type ConnectionRequest = {
  user: Partial<User>;
  userId: number;
  connectionId: number;
};
