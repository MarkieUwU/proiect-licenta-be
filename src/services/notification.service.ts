import { prisma } from "../server";
import { NotificationType } from "../models/enums/notification-type.enum";
import { ContentStatus } from "../models/enums/content-status.enum";

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

  // Post Report Notifications
  static async notifyPostReported(postId: number, reportId: number) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    // Notify post owner
    await this.createNotification({
      userId: post.userId,
      type: NotificationType.POST_REPORTED,
      message: "Your post has been reported and is under review",
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
      admins.map((admin) =>
        this.createNotification({
          userId: admin.id,
          type: NotificationType.POST_REPORTED,
          message: `New post report: "${post.title}"`,
          data: { 
            postId,
            reportId,
            postTitle: post.title,
            authorId: post.userId,
            authorName: post.user.fullName
          },
        })
      )
    );
  }

  // Post Status Change Notifications
  static async notifyPostStatusChange(postId: number, newStatus: ContentStatus, reason?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    let message = "";
    let notificationType: NotificationType;
    
    switch (newStatus) {
      case ContentStatus.ARCHIVED:
        message = `Your post "${post.title}" has been archived. Reason: ${reason}`;
        notificationType = NotificationType.POST_ARCHIVED;
        break;
      case ContentStatus.ACTIVE:
        message = `Your post "${post.title}" has been approved and is now visible`;
        notificationType = NotificationType.POST_APPROVED;
        break;
      case ContentStatus.REPORTED:
        message = `Your post "${post.title}" has been reported and is under review`;
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

    await this.createNotification({
      userId: post.userId,
      type: NotificationType.POST_LIKED,
      message: `${liker?.fullName} liked your post "${post.title}"`,
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
      await this.createNotification({
        userId: post.userId,
        type: NotificationType.POST_COMMENTED,
        message: `${commenter?.fullName} commented on your post "${post.title}"`,
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
          mentionedUsers.map((user) =>
            this.createNotification({
              userId: user.id,
              type: NotificationType.MENTIONED_IN_COMMENT,
              message: `${commenter?.fullName} mentioned you in a comment`,
              data: { 
                postId,
                postTitle: post.title,
                commentId,
                commenterId,
                commenterName: commenter?.fullName
              },
            })
          )
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
      users.map((user) =>
        this.createNotification({
          userId: user.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          message,
          data: { announcement: true },
        })
      )
    );
  }

  // Account Warning Notifications
  static async notifyAccountWarning(userId: number, reason: string) {
    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_WARNING,
      message: `Account Warning: ${reason}`,
      data: { warning: true, reason },
    });
  }
} 