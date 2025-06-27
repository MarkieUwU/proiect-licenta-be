import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create Users
    const users = [];
    const userPasswords = []; // Store passwords for summary
    const numUsers = 10;
    console.log('Passwords');
    
    // Create an admin user first
    const adminPassword = 'admin123';
    const adminSalt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync(adminPassword, adminSalt);
    
    const adminUser = await prisma.user.create({
      data: {
        profileImage: faker.image.avatar(),
        fullName: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        bio: 'System Administrator',
        gender: 'other',
        role: 'ADMIN',
      },
    });
    users.push(adminUser);
    userPasswords.push({ username: 'admin', password: adminPassword });
    console.log('admin: ', adminPassword);
    
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
      userPasswords.push({ username, password });

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
      // Add variety to post statuses for testing
      const status = faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'REPORTED', 'ARCHIVED']);

      const post = await prisma.post.create({
        data: {
          title,
          image,
          content,
          userId,
          status,
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
      // Add variety to comment statuses for testing
      const status = faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'REPORTED', 'ARCHIVED']);

      const comment = await prisma.comment.create({
        data: {
          text,
          author,
          isEdited,
          userId,
          postId,
          status,
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

    // Create Reports
    const numReports = 15;
    const reportReasons = [
      'Inappropriate content',
      'Spam',
      'Harassment',
      'False information',
      'Violence',
      'Copyright violation'
    ];
    
    for (let i = 0; i < numReports; i++) {
      const reporter = faker.helpers.arrayElement(users);
      const post = faker.helpers.arrayElement(posts);
      const reason = faker.helpers.arrayElement(reportReasons);

      // Ensure reporter is not the post author
      if (reporter.id !== post.userId) {
        await prisma.report.create({
          data: {
            reason,
            userId: reporter.id,
            postId: post.id,
          },
        });
      }
    }

    // Create Comment Reports
    const numCommentReports = 10;
    
    // First, get all comments
    const comments = await prisma.comment.findMany();
    
    for (let i = 0; i < numCommentReports; i++) {
      const reporter = faker.helpers.arrayElement(users);
      const comment = faker.helpers.arrayElement(comments);
      const reason = faker.helpers.arrayElement(reportReasons);

      // Ensure reporter is not the comment author
      if (reporter.id !== comment.userId) {
        await prisma.report.create({
          data: {
            reason,
            userId: reporter.id,
            postId: comment.postId,
            commentId: comment.id,
          },
        });
      }
    }

    // Create Notifications for all types
    console.log('Creating notifications...');
    
    // Get all posts, comments, and likes for notification data
    const allPosts = await prisma.post.findMany({ include: { user: true } });
    const allComments = await prisma.comment.findMany({ include: { user: true, post: true } });
    const allLikes = await prisma.like.findMany({ include: { user: true, post: true } });
    const allConnections = await prisma.connection.findMany({ 
      include: { 
        follower: true, 
        following: true 
      } 
    });

    // POST_LIKED notifications
    for (let i = 0; i < 25; i++) {
      const like = faker.helpers.arrayElement(allLikes);
      if (like.user.id !== like.post.userId) {
        await prisma.notification.create({
          data: {
            userId: like.post.userId,
            type: 'POST_LIKED',
            message: `${like.user.fullName} liked your post "${like.post.title}"`,
            data: JSON.stringify({
              postId: like.post.id,
              postTitle: like.post.title,
              likerId: like.user.id,
              likerName: like.user.fullName
            }),
            read: faker.datatype.boolean({ probability: 0.3 }),
            createdAt: faker.date.recent({ days: 7 }),
          },
        });
      }
    }

    // POST_COMMENTED notifications
    for (let i = 0; i < 30; i++) {
      const comment = faker.helpers.arrayElement(allComments);
      if (comment.user.id !== comment.post.userId) {
        await prisma.notification.create({
          data: {
            userId: comment.post.userId,
            type: 'POST_COMMENTED',
            message: `${comment.user.fullName} commented on your post "${comment.post.title}"`,
            data: JSON.stringify({
              postId: comment.post.id,
              postTitle: comment.post.title,
              commentId: comment.id,
              commenterId: comment.user.id,
              commenterName: comment.user.fullName
            }),
            read: faker.datatype.boolean({ probability: 0.4 }),
            createdAt: faker.date.recent({ days: 5 }),
          },
        });
      }
    }

    // POST_REPORTED notifications
    for (let i = 0; i < 8; i++) {
      const post = faker.helpers.arrayElement(allPosts);
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'POST_REPORTED',
          message: `Your post "${post.title}" has been reported and is under review`,
          data: JSON.stringify({
            postId: post.id,
            postTitle: post.title,
            reason: faker.helpers.arrayElement(['Inappropriate content', 'Spam', 'Harassment'])
          }),
          read: faker.datatype.boolean({ probability: 0.2 }),
          createdAt: faker.date.recent({ days: 3 }),
        },
      });
    }

    // POST_ARCHIVED notifications
    for (let i = 0; i < 5; i++) {
      const post = faker.helpers.arrayElement(allPosts);
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'POST_ARCHIVED',
          message: `Your post "${post.title}" has been archived. Reason: ${faker.helpers.arrayElement(['Violation of community guidelines', 'Copyright infringement', 'Inappropriate content'])}`,
          data: JSON.stringify({
            postId: post.id,
            postTitle: post.title,
            reason: 'Violation of community guidelines'
          }),
          read: faker.datatype.boolean({ probability: 0.1 }),
          createdAt: faker.date.recent({ days: 10 }),
        },
      });
    }

    // POST_APPROVED notifications
    for (let i = 0; i < 6; i++) {
      const post = faker.helpers.arrayElement(allPosts);
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'POST_APPROVED',
          message: `Your post "${post.title}" has been approved and is now visible`,
          data: JSON.stringify({
            postId: post.id,
            postTitle: post.title
          }),
          read: faker.datatype.boolean({ probability: 0.6 }),
          createdAt: faker.date.recent({ days: 2 }),
        },
      });
    }

    // NEW_FOLLOWER notifications
    for (let i = 0; i < 20; i++) {
      const connection = faker.helpers.arrayElement(allConnections);
      if (!connection.pending) {
        await prisma.notification.create({
          data: {
            userId: connection.following.id,
            type: 'NEW_FOLLOWER',
            message: `${connection.follower.fullName} started following you`,
            data: JSON.stringify({
              followerId: connection.follower.id,
              followerName: connection.follower.fullName
            }),
            read: faker.datatype.boolean({ probability: 0.5 }),
            createdAt: faker.date.recent({ days: 4 }),
          },
        });
      }
    }

    // MENTIONED_IN_COMMENT notifications
    for (let i = 0; i < 12; i++) {
      const comment = faker.helpers.arrayElement(allComments);
      const mentionedUser = faker.helpers.arrayElement(users);
      if (comment.user.id !== mentionedUser.id) {
        await prisma.notification.create({
          data: {
            userId: mentionedUser.id,
            type: 'MENTIONED_IN_COMMENT',
            message: `${comment.user.fullName} mentioned you in a comment on "${comment.post.title}"`,
            data: JSON.stringify({
              postId: comment.post.id,
              postTitle: comment.post.title,
              commentId: comment.id,
              commenterId: comment.user.id,
              commenterName: comment.user.fullName
            }),
            read: faker.datatype.boolean({ probability: 0.3 }),
            createdAt: faker.date.recent({ days: 6 }),
          },
        });
      }
    }

    // MENTIONED_IN_POST notifications
    for (let i = 0; i < 8; i++) {
      const post = faker.helpers.arrayElement(allPosts);
      const mentionedUser = faker.helpers.arrayElement(users);
      if (post.user.id !== mentionedUser.id) {
        await prisma.notification.create({
          data: {
            userId: mentionedUser.id,
            type: 'MENTIONED_IN_POST',
            message: `${post.user.fullName} mentioned you in their post "${post.title}"`,
            data: JSON.stringify({
              postId: post.id,
              postTitle: post.title,
              posterId: post.user.id,
              posterName: post.user.fullName
            }),
            read: faker.datatype.boolean({ probability: 0.4 }),
            createdAt: faker.date.recent({ days: 8 }),
          },
        });
      }
    }

    // SYSTEM_ANNOUNCEMENT notifications
    const systemAnnouncements = [
      'New features are now available! Check out our latest updates.',
      'We\'ve updated our community guidelines. Please review them.',
      'Scheduled maintenance will occur tonight at 2 AM UTC.',
      'Welcome to our platform! We\'re excited to have you here.',
      'Don\'t forget to complete your profile to get the most out of our platform.'
    ];

    for (let i = 0; i < 15; i++) {
      const user = faker.helpers.arrayElement(users);
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM_ANNOUNCEMENT',
          message: faker.helpers.arrayElement(systemAnnouncements),
          data: JSON.stringify({ announcement: true }),
          read: faker.datatype.boolean({ probability: 0.7 }),
          createdAt: faker.date.recent({ days: 15 }),
        },
      });
    }

    // ACCOUNT_WARNING notifications
    const warningReasons = [
      'Multiple community guideline violations detected',
      'Suspicious activity detected on your account',
      'Please verify your email address',
      'Your account has been temporarily restricted',
      'Unusual login activity detected'
    ];

    for (let i = 0; i < 6; i++) {
      const user = faker.helpers.arrayElement(users);
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'ACCOUNT_WARNING',
          message: `Account Warning: ${faker.helpers.arrayElement(warningReasons)}`,
          data: JSON.stringify({ 
            warning: true, 
            reason: faker.helpers.arrayElement(warningReasons)
          }),
          read: faker.datatype.boolean({ probability: 0.1 }),
          createdAt: faker.date.recent({ days: 12 }),
        },
      });
    }

    // Create a summary of all users and their credentials
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n=== USER CREDENTIALS FOR TESTING ===');
    console.log('Note: All passwords are randomly generated except admin');
    console.log('');
    
    // Get all users with their credentials
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true
      },
      orderBy: { id: 'asc' }
    });
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Role: ${user.role}`);
      const passwordEntry = userPasswords.find(p => p.username === user.username);
      if (passwordEntry) {
        console.log(`   Password: ${passwordEntry.password}`);
      } else {
        console.log(`   Password: (not found)`);
      }
      console.log('');
    });
    
    console.log('=== DATABASE STATISTICS ===');
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.connection.count(),
      prisma.report.count(),
      prisma.notification.count()
    ]);
    
    console.log(`Users: ${stats[0]}`);
    console.log(`Posts: ${stats[1]}`);
    console.log(`Comments: ${stats[2]}`);
    console.log(`Likes: ${stats[3]}`);
    console.log(`Connections: ${stats[4]}`);
    console.log(`Reports: ${stats[5]}`);
    console.log(`Notifications: ${stats[6]}`);
    console.log('\n' + '='.repeat(60));

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
