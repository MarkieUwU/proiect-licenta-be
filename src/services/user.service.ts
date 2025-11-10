import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { PrivacyOptions } from '../models/enums/privacy-optinos.enum';
import type { Role } from '../models/enums/role.enum';
import { Theme } from '../models/enums/theme.enum';
import type {
  LoggedUser,
  SettingsRequest,
  UserProfile,
  UserRequest,
  UserSettings,
} from '../models/user.model';
import { prisma } from '../server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export class UserService {
  static async getUserProfile(username: string): Promise<UserProfile> {
    const user = await prisma.user.findFirst({
      where: { username },
      select: this.getUserDetailsQuerySelect(),
    });
    return this.generateUserProfileResponse(user);
  }

  static getUserDetailsQuerySelect() {
    return {
      id: true,
      profileImage: true,
      username: true,
      fullName: true,
      email: true,
      gender: true,
      bio: true,
      _count: {
        select: {
          follower: { where: { pending: false } },
          following: { where: { pending: false } },
          posts: { where: { status: { not: 'ARCHIVED' } } },
        },
      },
      follower: {
        select: {
          followerId: true,
          followingId: true,
          pending: true,
        },
      },
      following: {
        select: {
          followerId: true,
          followingId: true,
          pending: true,
        },
      },
      settings: {
        select: {
          theme: true,
          language: true,
          detailsPrivacy: true,
          connectionsPrivacy: true,
          postsPrivacy: true,
        },
      },
    };
  }

  private static generateUserProfileResponse(user: any): UserProfile {
    if (!user) return user;
    const userResponse: UserProfile = {
      id: user.id,
      profileImage: user.profileImage,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      ...(user.gender ? { gender: user.gender } : {}),
      bio: user.bio,
      ...(user.settings && { settings: user.settings }),
      posts: [],
      postsCount: user._count.posts,
      connections: [],
      connectionsCount: user._count.follower + user._count.following,
    };
    return userResponse;
  }

  static async upsertSettings(
    userId: string,
    request?: Partial<SettingsRequest>
  ): Promise<UserSettings> {
    return await prisma.settings.upsert({
      where: {
        userId,
      },
      update: request ?? {},
      create: {
        language: request?.language ?? 'en',
        theme: request?.theme ?? Theme.dark,
        detailsPrivacy: request?.detailsPrivacy ?? PrivacyOptions.public,
        connectionsPrivacy:
          request?.connectionsPrivacy ?? PrivacyOptions.public,
        postsPrivacy: request?.postsPrivacy ?? PrivacyOptions.public,
        userId,
      },
    });
  }

  static async registerUser(
    request: UserRequest
  ): Promise<{ token: string; loggedUser: LoggedUser }> {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(request.password, salt);

    const user = await prisma.user.create({
      data: {
        fullName: request.fullName,
        username: request.username,
        email: request.email,
        passwordHash,
        profileImage: '',
        ...(request.gender?.length && { gender: request.gender }),
      },
    });
    this.upsertSettings(user.id);

    const loggedUser: LoggedUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      theme: request.theme || Theme.dark,
      language: request.language,
      role: user.role as Role,
    };

    const token = this.getJWTToken(loggedUser);

    return { token, loggedUser };
  }

  static getJWTToken(loggedUser: LoggedUser): string {
    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign(loggedUser, jwtSecret!, { expiresIn: '2d' });
    return token;
  }

  static async sendPasswordResetEmail(
    userId: string,
    email: string
  ): Promise<SMTPTransport.SentMessageInfo> {
    const resetJwtSecret = process.env.RESET_JWT_SECRET;
    const token = jwt.sign({ userId }, resetJwtSecret!, {
      expiresIn: '1h',
    });
    const resetLink = `${process.env.FE_URL}/reset-password/${token}`;

    const mailPasscode = process.env.MAIL_PASSCODE;
    const gmailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sabiadeaur@gmail.com',
        pass: mailPasscode,
      },
    });

    return await gmailTransporter.sendMail({
      from: 'SocialMediaApp <no-reply@socialmediapp.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
          <p>You requested a password reset. Click the button to reset your password:</p>
          <p>
            <a 
              style="background-color: #5696b9; border-radius: 20px; text-decoration: none; color: white; padding: 0.5rem 1rem;" 
              href="${resetLink}">
                Reset password
            </a>
          </p>
          <p style="margin-top: 1rem">If you did not request this, please ignore this email.</p>`,
    });
  }
}
