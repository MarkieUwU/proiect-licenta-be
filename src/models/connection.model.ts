import type { ConnectionStateEnum } from "./enums/connection-state.enum";
import type { UserDetails } from "./user.model";

export type ConnectionUser = UserDetails & {
  connectionCount: number;
  postsCount: number;
};

export interface ConnectionResponse {
  user: ConnectionUser;
  userId: string;
  pending: boolean;
}

export type ConnectionRequest = {
  user: UserDetails;
  userId: string;
  connectionId: string;
};

export type ConnectionState = {
  state: ConnectionStateEnum,
  userId: string;
  connectionId: string;
}

export type Suggestion = {
  user: ConnectionUser,
  followerId?: string;
  followingId?: string;
  state: ConnectionStateEnum
}
