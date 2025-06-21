import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create Users
    const users = [];
    const numUsers = 10;
    console.log('Passwords');
    for (let i = 0; i < numUsers; i++) {
      const fullName = faker.person.fullName();
      const username = faker.internet.username();
      const email = faker.internet.email();
      const password = faker.internet.password({ length: 12 });
      const bio = faker.lorem.sentence();
      const gender = faker.person.sexType();
      const profileImage = faker.image.avatar();

      console.log(username, ': ', password);

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const user = await prisma.user.create({
        data: {
          profileImage,
          fullName,
          username,
          email,
          passwordHash,
          bio,
          gender,
        },
      });
      users.push(user);

      // Create Settings for each user
      await prisma.settings.create({
        data: {
          theme: faker.helpers.arrayElement(['light', 'dark']),
          language: faker.helpers.arrayElement(['en', 'ro', 'fr']),
          detailsPrivacy: faker.helpers.arrayElement([
            'public',
            'followers',
            'private',
          ]),
          connectionsPrivacy: faker.helpers.arrayElement([
            'public',
            'followers',
            'private',
          ]),
          postsPrivacy: faker.helpers.arrayElement([
            'public',
            'followers',
            'private',
          ]),
          userId: user.id,
        },
      });
    }

    // Create Posts
    const posts = [];
    const numPosts = 20;
    for (let i = 0; i < numPosts; i++) {
      const title = faker.lorem.sentence();
      const content = faker.lorem.paragraphs(3, '\n\n');
      const image = faker.image.url({
        width: faker.number.int({ min: 400, max: 600 }),
        height: faker.number.int({ min: 400, max: 600 }),
      });
      const userId = faker.helpers.arrayElement(users).id;

      const post = await prisma.post.create({
        data: {
          title,
          image,
          content,
          userId,
        },
      });
      posts.push(post);
    }

    // Create Likes
    const numLikes = 30;
    for (let i = 0; i < numLikes; i++) {
      const userId = faker.helpers.arrayElement(users).id;
      const postId = faker.helpers.arrayElement(posts).id;

      // Ensure no duplicate likes for the same user and post
      const existingLike = await prisma.like.findFirst({
        where: {
          AND: [{ userId: Number(userId) }, { postId: Number(postId) }],
        },
      });

      if (!existingLike) {
        const like = await prisma.like.create({
          data: {
            userId,
            postId,
          },
        });
      }
    }

    // Create Comments
    const numComments = 40;
    for (let i = 0; i < numComments; i++) {
      const text = faker.lorem.sentence();
      const author = faker.person.fullName(); // While we have users, let's simulate different commenters
      const isEdited = faker.datatype.boolean({ probability: 0.2 });
      const userId = faker.helpers.arrayElement(users).id;
      const postId = faker.helpers.arrayElement(posts).id;

      const comment = await prisma.comment.create({
        data: {
          text,
          author,
          isEdited,
          userId,
          postId,
        },
      });
    }

    // Create Connections (Followers/Following)
    const numConnections = 30;
    for (let i = 0; i < numConnections; i++) {
      const follower = faker.helpers.arrayElement(users);
      const following = faker.helpers.arrayElement(users);

      // Ensure follower and following are different
      if (follower.id !== following.id) {
        // Avoid duplicate connections
        let existingConnection = await prisma.connection.findUnique({
          where: {
            followingId_followerId: {
              followingId: following.id,
              followerId: follower.id,
            },
          },
        });

        if (existingConnection) continue;

        existingConnection = await prisma.connection.findUnique({
          where: {
            followingId_followerId: {
              followingId: follower.id,
              followerId: following.id
            }
          }
        });

        if (!existingConnection) {
          await prisma.connection.create({
            data: {
              followerId: follower.id,
              followingId: following.id,
              pending: faker.datatype.boolean({ probability: 0.3 }),
            },
          });
        }
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
