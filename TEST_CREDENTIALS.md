# Test Credentials and Database Information

## User Credentials for Testing

### Admin User
- **Username:** `admin`
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** `ADMIN`
- **Name:** Admin User

### Regular Users
1. **Username:** `Rico.Beer36`
   - **Email:** `Lawson40@hotmail.com`
   - **Password:** `xVu7TC_T`
   - **Name:** Freda Corwin
   - **Role:** `USER`

2. **Username:** `Lora.Schaefer35`
   - **Email:** `Marcelino_Grimes68@hotmail.com`
   - **Password:** `t9X3PVaw`
   - **Name:** Geneva Altenwerth
   - **Role:** `USER`

3. **Username:** `Zachariah63`
   - **Email:** `Telly.Wuckert@hotmail.com`
   - **Password:** `DrUk4kwI`
   - **Name:** Jennifer Reilly
   - **Role:** `USER`

4. **Username:** `Federico_Berge-Brakus`
   - **Email:** `Zora.Beahan@yahoo.com`
   - **Password:** `viyBu9lm`
   - **Name:** Mr. Paul Lueilwitz
   - **Role:** `USER`

5. **Username:** `Lisandro.Farrell`
   - **Email:** `Monte.Haag@gmail.com`
   - **Password:** `BiaJc2Dk`
   - **Name:** Drew Ankunding
   - **Role:** `USER`

## Database Statistics

The database is now populated with comprehensive sample data:

- **Users:** 27 (including the 6 test users above)
- **Posts:** 55 (with various statuses: ACTIVE, REPORTED, ARCHIVED)
- **Comments:** 105 (with various statuses and some marked as edited)
- **Likes:** 88 (distributed across posts)
- **Connections:** 66 (followers/following relationships, some pending)
- **Reports:** 28 (both post and comment reports)
- **Notifications:** 50 (covering all notification types)

## Notification Types Included

The database contains notifications for all types:

1. **POST_LIKED** - When someone likes a post
2. **POST_COMMENTED** - When someone comments on a post
3. **POST_REPORTED** - When a post is reported
4. **POST_ARCHIVED** - When a post is archived
5. **POST_APPROVED** - When a post is approved
6. **NEW_FOLLOWER** - When someone starts following you
7. **MENTIONED_IN_COMMENT** - When mentioned in a comment
8. **MENTIONED_IN_POST** - When mentioned in a post
9. **SYSTEM_ANNOUNCEMENT** - System-wide announcements
10. **ACCOUNT_WARNING** - Account warnings

## Content Statuses

Posts and comments have various statuses for testing:
- **ACTIVE** - Normal content
- **REPORTED** - Content under review
- **ARCHIVED** - Hidden content

## Testing Scenarios

You can now test:

1. **Admin Features:**
   - Login as `admin` / `admin123`
   - Access admin dashboard
   - Manage users, posts, comments, reports
   - View analytics

2. **User Features:**
   - Login with any regular user
   - Create posts, comments, likes
   - Follow other users
   - Report content
   - View notifications

3. **Notification System:**
   - Check notification bell in header
   - Visit notifications page
   - Mark notifications as read
   - See different notification types

4. **Content Management:**
   - Posts with different statuses
   - Comments with different statuses
   - Reports on posts and comments
   - User connections and relationships

## Scripts Available

- `create-test-users.js` - Creates the test users with credentials
- `create-sample-data.js` - Populates the database with sample data
- `src/prisma/seed.js` - Original comprehensive seed script (updated)

## Notes

- All passwords are randomly generated except for admin
- The database uses SQLite for development
- All data is realistic and interconnected
- Notifications have realistic timestamps and read/unread states
- Content has various statuses to test moderation features 