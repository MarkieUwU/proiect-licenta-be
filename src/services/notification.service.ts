import { prisma } from "../server";
import { NotificationType } from "../models/enums/notification-type.enum";
import { ContentStatus } from "../models/enums/content-status.enum";
import { t } from "../i18n/utils";

export class NotificationService {
  static async createNotification({
    userId,
    type,
    message,
    data,
  }: {
    userId: number;
    type: NotificationType;
    message: string;
    data?: Record<string, any>;
  }) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });
  }

  // Helper method to get user's preferred language
  static async getUserLanguage(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        settings: {
          select: { language: true }
        }
      },
    });
    return user?.settings?.language || 'en';
  }

  // Post Report Notifications
  static async notifyPostReported(postId: number, reportId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    // Get user's language preference
    const userLanguage = await this.getUserLanguage(post.userId);

    // Notify post owner
    await this.createNotification({
      userId: post.userId,
      type: NotificationType.POST_REPORTED,
      message: t("notifications.postReported", { lng: userLanguage }),
      data: { 
        postId,
        reportId,
        postTitle: post.title 
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    await Promise.all(
      admins.map(async (admin) => {
        const adminLanguage = await this.getUserLanguage(admin.id);
        return this.createNotification({
          userId: admin.id,
          type: NotificationType.POST_REPORTED,
          message: t("notifications.postReported", { lng: adminLanguage }),
          data: { 
            postId,
            reportId,
            postTitle: post.title,
            authorId: post.userId,
            authorName: post.user.fullName
          },
        });
      })
    );
  }

  // Post Status Change Notifications
  static async notifyPostStatusChange(postId: number, newStatus: ContentStatus, reason?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    const userLanguage = await this.getUserLanguage(post.userId);
    let message = "";
    let notificationType: NotificationType;
    
    switch (newStatus) {
      case ContentStatus.ARCHIVED:
        message = t("notifications.postArchived", { 
          lng: userLanguage,
          title: post.title,
          reason: reason || ""
        });
        notificationType = NotificationType.POST_ARCHIVED;
        break;
      case ContentStatus.ACTIVE:
        message = t("notifications.postApproved", { 
          lng: userLanguage,
          title: post.title
        });
        notificationType = NotificationType.POST_APPROVED;
        break;
      case ContentStatus.REPORTED:
        message = t("notifications.postReported", { lng: userLanguage });
        notificationType = NotificationType.POST_REPORTED;
        break;
      default:
        return; // Don't send notification for unknown status
    }

    await this.createNotification({
      userId: post.userId,
      type: notificationType,
      message,
      data: { 
        postId,
        postTitle: post.title,
        reason 
      },
    });
  }

  // Comment Status Change Notifications
  static async notifyCommentStatusChange(commentId: number, newStatus: ContentStatus, reason?: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { 
        user: true,
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
    });

    if (!comment) return;

    const userLanguage = await this.getUserLanguage(comment.userId);
    let message = "";
    let notificationType: NotificationType;
    
    switch (newStatus) {
      case ContentStatus.ARCHIVED:
        message = t("notifications.commentArchived", { 
          lng: userLanguage,
          title: comment.post.title,
          reason: reason || ""
        });
        notificationType = NotificationType.COMMENT_ARCHIVED;
        break;
      case ContentStatus.ACTIVE:
        message = t("notifications.commentApproved", { 
          lng: userLanguage,
          title: comment.post.title
        });
        notificationType = NotificationType.COMMENT_APPROVED;
        break;
      case ContentStatus.REPORTED:
        message = t("notifications.commentReported", { lng: userLanguage });
        notificationType = NotificationType.COMMENT_REPORTED;
        break;
      default:
        return; // Don't send notification for unknown status
    }

    await this.createNotification({
      userId: comment.userId,
      type: notificationType,
      message,
      data: { 
        commentId,
        postId: comment.post.id,
        postTitle: comment.post.title,
        reason 
      },
    });
  }

  // Engagement Notifications
  static async notifyPostLiked(postId: number, likerId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post || post.userId === likerId) return;

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
    });

    const userLanguage = await this.getUserLanguage(post.userId);

    await this.createNotification({
      userId: post.userId,
      type: NotificationType.POST_LIKED,
      message: t("notifications.postLiked", { 
        lng: userLanguage,
        username: liker?.fullName
      }),
      data: { 
        postId,
        postTitle: post.title,
        likerId,
        likerName: liker?.fullName
      },
    });
  }

  static async notifyNewComment(postId: number, commentId: number, commenterId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
    });

    // Notify post owner
    if (post.userId !== commenterId) {
      const userLanguage = await this.getUserLanguage(post.userId);
      
      await this.createNotification({
        userId: post.userId,
        type: NotificationType.POST_COMMENTED,
        message: t("notifications.postCommented", { 
          lng: userLanguage,
          username: commenter?.fullName
        }),
        data: { 
          postId,
          postTitle: post.title,
          commentId,
          commenterId,
          commenterName: commenter?.fullName
        },
      });
    }

    // Notify mentioned users
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment) {
      const mentions = this.extractMentions(comment.text);
      if (mentions.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
          where: {
            username: { in: mentions },
          },
        });

        await Promise.all(
          mentionedUsers.map(async (user) => {
            const userLanguage = await this.getUserLanguage(user.id);
            
            return this.createNotification({
              userId: user.id,
              type: NotificationType.MENTIONED_IN_COMMENT,
              message: t("notifications.mentionedInComment", { 
                lng: userLanguage,
                username: commenter?.fullName
              }),
              data: { 
                postId,
                postTitle: post.title,
                commentId,
                commenterId,
                commenterName: commenter?.fullName
              },
            });
          })
        );
      }
    }
  }

  // Helper method to extract @mentions from text
  private static extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  }

  // System Notifications
  static async notifySystemAnnouncement(message: string, userIds?: number[]) {
    const users = userIds 
      ? await prisma.user.findMany({ where: { id: { in: userIds } } })
      : await prisma.user.findMany();

    await Promise.all(
      users.map(async (user) => {
        const userLanguage = await this.getUserLanguage(user.id);
        
        return this.createNotification({
          userId: user.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          message: t("notifications.systemAnnouncement", { 
            lng: userLanguage,
            message
          }),
          data: { announcement: true },
        });
      })
    );
  }

  // Account Warning Notifications
  static async notifyAccountWarning(userId: number, reason: string) {
    const userLanguage = await this.getUserLanguage(userId);
    
    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_WARNING,
      message: t("notifications.accountWarning", { 
        lng: userLanguage,
        message: reason
      }),
      data: { warning: true, reason },
    });
  }
} 