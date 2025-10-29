import type { Theme } from "./enums/theme.enum";
import type { LanguageCodes } from "./enums/language-code.enum";
import type { Role } from "./enums/role.enum";
import type { Post } from "./post.model";

export type UserProfile = {
  id: string;
  profileImage: string;
  username: string;
  fullName: string;
  email: string;
  gender?: string;
  bio?: string | null;
  settings: UserSettings;
  posts: Post[];
  postsCount: number;
  connections: UserDetails[];
  connectionsCount: number;
};

export type UserRequest = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  gender: string;
  confirmPassword: string;
  theme: Theme;
  language: LanguageCodes;
};

export type UserDetails = {
  id: string;
  profileImage: string;
  username: string;
  fullName: string;
};

export type LoggedUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  theme: Theme;
  language: LanguageCodes;
  role: Role;
};

export type UserSettings = {
  theme: string;
  language: string;
  detailsPrivacy: string;
  connectionsPrivacy: string;
  postsPrivacy: string;
}

export type SettingsRequest = {
  language: string;
  theme: string;
  detailsPrivacy: string;
  connectionsPrivacy: string;
  postsPrivacy: string;
};
