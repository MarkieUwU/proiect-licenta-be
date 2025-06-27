import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('Creating test users...\n');
    
    const users = [];
    const userPasswords = [];
    
    // Create admin user
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
    
    // Create Settings for admin user
    await prisma.settings.create({
      data: {
        theme: 'dark',
        language: 'en',
        detailsPrivacy: 'public',
        connectionsPrivacy: 'public',
        postsPrivacy: 'public',
        userId: adminUser.id,
      },
    });
    
    users.push(adminUser);
    userPasswords.push({ username: 'admin', password: adminPassword });
    
    // Create regular users
    for (let i = 0; i < 5; i++) {
      const fullName = faker.person.fullName();
      const username = faker.internet.username();
      const email = faker.internet.email();
      const password = faker.internet.password({ length: 8 });
      const bio = faker.lorem.sentence();
      const gender = faker.person.sexType();
      const profileImage = faker.image.avatar();

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
          role: 'USER',
        },
      });
      
      // Create Settings for regular user
      await prisma.settings.create({
        data: {
          theme: faker.helpers.arrayElement(['light', 'dark']),
          language: faker.helpers.arrayElement(['en', 'ro']),
          detailsPrivacy: 'public',
          connectionsPrivacy: 'public',
          postsPrivacy: 'public',
          userId: user.id,
        },
      });
      
      users.push(user);
      userPasswords.push({ username, password });
    }
    
    console.log('='.repeat(60));
    console.log('TEST USERS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n=== USER CREDENTIALS FOR TESTING ===\n');
    
    userPasswords.forEach((cred, index) => {
      const user = users.find(u => u.username === cred.username);
      console.log(`${index + 1}. Username: ${cred.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${cred.password}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('You can now use these credentials to test the application!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers(); 