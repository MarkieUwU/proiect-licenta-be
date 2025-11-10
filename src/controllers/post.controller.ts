import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { NotificationService } from '../services/notification.service';
import { ContentStatus } from '../models/enums/content-status.enum';
import { Role } from '../models/enums/role.enum';
import { PostService } from '../services/post.service';

export const getFilteredPosts = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const posts = await PostService.getPosts();
  const result = await PostService.filterPostsByPrivacyOptions(userId, posts);
  
  res.json(result);
});

export const createPostByUserId = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  const { title, image, content } = req.body;
  const post = await prisma.post.create({
    data: { title, image, content, userId },
  });
  res.json(post);
});

export const updatePost = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const { title, image, content } = req.body;
  const post = await prisma.post.update({
    data: { title, image, content },
    where: { id },
  });
  res.json(post);
});

export const deletePost = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.role === Role.ADMIN;

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

  if (!isAdmin && post.userId !== userId) {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }

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

  const deletedPost = await prisma.post.delete({
    where: { id }
  });

  if (isAdmin) {
    await NotificationService.notifyPostStatusChange(
      id,
      ContentStatus.ARCHIVED,
      "Post was deleted by an administrator"
    );
  }

  res.json(deletedPost);
});
