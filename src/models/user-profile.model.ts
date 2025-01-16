import type { Post } from "@prisma/client";

export type UserProfile = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  bio: string | null;
  posts: Post[];
  connections: ConnectionUser[];
}

export type ConnectionUser = {
  id: number;
  username: string;
  fullName: string;
}
