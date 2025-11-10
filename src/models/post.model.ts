import type { UserDetails } from "./user.model";

export type Post = {
  id: string;
  title: string;
  image: string;
  content: string;
  createdAt: Date;
  userId: string;
  user: PostUserDetails;
  comments: Comment[];
  likes: Like[];
};

export type PostUserDetails = UserDetails & {
  settings: { postsPrivacy: string } | null
}

export type Like = {
  id: string;
  userId: string;
  postId: string;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  updatedAt: Date;
  isEdited: boolean | null;
  postId: string;
  userId: string;
};
