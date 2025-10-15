import type { Connection, User } from "@prisma/client"

export type UserConnection = {
  user: Partial<User>;
  userId: string;
  pending: boolean;
  connection: Connection | null
}

export type ConnectionRequest = {
  user: Partial<User>;
  userId: string;
  connectionId: string;
};
