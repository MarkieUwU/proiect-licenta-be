import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { PrivacyOptions } from '../models/enums/privacy-optinos.enum';
import { NotificationService } from '../services/notification.service';
import { ContentStatus } from '../models/enums/content-status.enum';
import { Role } from '../models/enums/role.enum';

export const getFilteredPosts = asyncHandler(async (req, res, next) => {
  const { sortCriterias, userId } = req.body;
  const request = {
    ...(sortCriterias ? { orderBy: sortCriterias } : {}),
    include: {
      user: {
        include: {
          settings: true,
          follower: true,
          following: true
        },
      },
      likes: true,
      comments: true,
    },
  };

  // Only show posts that are not archived
  const posts = await prisma.post.findMany({
    ...request,
    where: {
      status: { not: ContentStatus.ARCHIVED }
    }
  });

  const finalResult = posts.filter((post) => {
    if (post.user.id === userId) return true;

    const privacy = post.user.settings?.postsPrivacy;
    const connections = post.user.follower.map((connection) => connection.followingId);
    connections.push(...post.user.following.map((connection) => connection.followerId));

    switch (privacy) {
      case PrivacyOptions.public:
        return true;
      case PrivacyOptions.private:
        return false;
      case PrivacyOptions.followers:
        return connections.includes(Number(userId));
    }
  });

  res.json(finalResult);
});

export const createPostByUserId = asyncHandler(async (req, res, next) => {
  const userId = Number(req.params.userId);
  const { title, image, content } = req.body;
  const post = await prisma.post.create({
    data: { title, image, content, userId },
  });
  res.json(post);
});

export const updatePost = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { title, image, content } = req.body;
  const post = await prisma.post.update({
    data: { title, image, content },
    where: { id },
  });
  res.json(post);
});

export const deletePost = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const userId = req.user.id;
  const isAdmin = req.user.role === Role.ADMIN;

  // Get the post first to check ownership
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: true
    }
  });

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Check if user is authorized to delete
  if (!isAdmin && post.userId !== userId) {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }

  // Delete related records
  await Promise.all([
    prisma.comment.deleteMany({
      where: { postId: id }
    }),
    prisma.like.deleteMany({
      where: { postId: id }
    }),
    prisma.report.deleteMany({
      where: { postId: id }
    })
  ]);

  // Delete the post
  const deletedPost = await prisma.post.delete({
    where: { id }
  });

  // If admin deleted the post, notify the user
  if (isAdmin) {
    await NotificationService.notifyPostStatusChange(
      id,
      ContentStatus.ARCHIVED,
      "Post was deleted by an administrator"
    );
  }

  res.json(deletedPost);
});
