import type { Post } from "@prisma/client";
import type { Theme } from "./enums/theme.enum";
import type { LanguageCodes } from "./enums/language-code.enum";
import type { Role } from "./enums/role.enum";

export type UserProfile = {
  id: number;
  profileImage: string;
  username: string;
  fullName: string;
  email: string;
  gender?: string;
  bio?: string | null;
  posts: Post[];
  connections?: ConnectionUser[];
};

export type ConnectionUser = {
  id: number;
  profileImage: string;
  username: string;
  fullName: string;
};

export type LoggedUser = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  theme: Theme;
  language: LanguageCodes;
  role: Role;
};
