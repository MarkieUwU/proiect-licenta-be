import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('Creating sample data for all models...\n');
    
    // Get existing users
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('No users found. Please run create-test-users.js first.');
      return;
    }
    
    console.log(`Found ${users.length} users. Creating sample data...\n`);
    
    // Create Posts
    console.log('Creating posts...');
    const posts = [];
    for (let i = 0; i < 15; i++) {
      const title = faker.lorem.sentence();
      const content = faker.lorem.paragraphs(2, '\n\n');
      const image = faker.image.url({
        width: faker.number.int({ min: 400, max: 600 }),
        height: faker.number.int({ min: 400, max: 600 }),
      });
      const userId = faker.helpers.arrayElement(users).id;
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
    console.log(`Created ${posts.length} posts`);

    // Create Comments
    console.log('Creating comments...');
    const comments = [];
    for (let i = 0; i < 25; i++) {
      const text = faker.lorem.sentence();
      const author = faker.person.fullName();
      const isEdited = faker.datatype.boolean({ probability: 0.2 });
      const userId = faker.helpers.arrayElement(users).id;
      const postId = faker.helpers.arrayElement(posts).id;
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
      comments.push(comment);
    }
    console.log(`Created ${comments.length} comments`);

    // Create Likes
    console.log('Creating likes...');
    for (let i = 0; i < 30; i++) {
      const userId = faker.helpers.arrayElement(users).id;
      const postId = faker.helpers.arrayElement(posts).id;

      // Ensure no duplicate likes
      const existingLike = await prisma.like.findFirst({
        where: {
          AND: [{ userId: Number(userId) }, { postId: Number(postId) }],
        },
      });

      if (!existingLike) {
        await prisma.like.create({
          data: {
            userId,
            postId,
          },
        });
      }
    }
    console.log('Created likes');

    // Create Connections (Followers/Following)
    console.log('Creating connections...');
    for (let i = 0; i < 20; i++) {
      const follower = faker.helpers.arrayElement(users);
      const following = faker.helpers.arrayElement(users);

      if (follower.id !== following.id) {
        // Avoid duplicate connections
        const existingConnection = await prisma.connection.findUnique({
          where: {
            followingId_followerId: {
              followingId: following.id,
              followerId: follower.id,
            },
          },
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
    console.log('Created connections');

    // Create Reports
    console.log('Creating reports...');
    const reportReasons = [
      'Inappropriate content',
      'Spam',
      'Harassment',
      'False information',
      'Violence',
      'Copyright violation'
    ];
    
    for (let i = 0; i < 10; i++) {
      const reporter = faker.helpers.arrayElement(users);
      const post = faker.helpers.arrayElement(posts);
      const reason = faker.helpers.arrayElement(reportReasons);

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
    console.log('Created reports');

    // Create Comment Reports
    console.log('Creating comment reports...');
    for (let i = 0; i < 5; i++) {
      const reporter = faker.helpers.arrayElement(users);
      const comment = faker.helpers.arrayElement(comments);
      const reason = faker.helpers.arrayElement(reportReasons);

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
    console.log('Created comment reports');

    // Create Notifications
    console.log('Creating notifications...');
    
    // Get all data for notifications
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
    for (let i = 0; i < 15; i++) {
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
    for (let i = 0; i < 20; i++) {
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

    // NEW_FOLLOWER notifications
    for (let i = 0; i < 12; i++) {
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

    // SYSTEM_ANNOUNCEMENT notifications
    const systemAnnouncements = [
      'New features are now available! Check out our latest updates.',
      'We\'ve updated our community guidelines. Please review them.',
      'Scheduled maintenance will occur tonight at 2 AM UTC.',
      'Welcome to our platform! We\'re excited to have you here.',
      'Don\'t forget to complete your profile to get the most out of our platform.'
    ];

    for (let i = 0; i < 8; i++) {
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

    console.log('Created notifications');

    // Show final statistics
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.connection.count(),
      prisma.report.count(),
      prisma.notification.count()
    ]);
    
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE DATA CREATION COMPLETED!');
    console.log('='.repeat(60));
    console.log('\n=== DATABASE STATISTICS ===');
    console.log(`Users: ${stats[0]}`);
    console.log(`Posts: ${stats[1]}`);
    console.log(`Comments: ${stats[2]}`);
    console.log(`Likes: ${stats[3]}`);
    console.log(`Connections: ${stats[4]}`);
    console.log(`Reports: ${stats[5]}`);
    console.log(`Notifications: ${stats[6]}`);
    console.log('\n' + '='.repeat(60));
    console.log('Your database is now populated with sample data!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData(); 