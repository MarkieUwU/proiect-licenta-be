# Backend Internationalization

This project now supports internationalization (i18n) for backend response messages, error messages, and notifications.

## Features

- **Automatic Language Detection**: The system automatically detects the user's preferred language from request headers
- **Localized Error Messages**: All API errors are returned in the user's preferred language
- **Localized Success Messages**: Success responses include translated messages
- **Notification Translations**: System notifications support multiple languages
- **Email Templates**: Email content can be translated

## Supported Languages

- English (`en`) - Default
- Romanian (`ro`)

## How It Works

### 1. Language Detection

The system detects the user's language preference through:
1. `Accept-Language-Preference` header (sent by frontend)
2. `Accept-Language` header (browser default)
3. Fallback to English if no preference is found

### 2. Frontend Integration

The frontend automatically sends the current language in requests:

```typescript
// In assets/config.ts
config.headers['Accept-Language-Preference'] = i18n.language;
```

### 3. Using Internationalized Responses

#### Success Responses

```typescript
import { ApiResponse } from '../utils/ApiResponse';

// Generic success with custom message key
ApiResponse.success(req, res, data, 'success.operationCompleted');

// Specific success methods
ApiResponse.userCreated(req, res, userData);
ApiResponse.postUpdated(req, res, postData);
ApiResponse.loginSuccessful(req, res, { token, userProfile });
```

#### Error Responses

```typescript
import { ApiError } from '../error/LocalizedApiError';

// Specific error methods (automatically localized)
throw ApiError.userNotFound();
throw ApiError.emailAlreadyExists();
throw ApiError.passwordsDontMatch();

// Generic errors with custom message keys
throw new ApiError(400, "Bad Request", 'errors.customError', { param: 'value' });
```

## Translation Files

Translation files are located in `src/i18n/locales/`:

### English (`en/translation.json`)
```json
{
  "errors": {
    "userNotFound": "User not found",
    "emailAlreadyExists": "Email already exists!"
  },
  "success": {
    "userCreated": "User created successfully",
    "loginSuccessful": "Login successful"
  }
}
```

### Romanian (`ro/translation.json`)
```json
{
  "errors": {
    "userNotFound": "Utilizatorul nu a fost găsit",
    "emailAlreadyExists": "Email-ul există deja!"
  },
  "success": {
    "userCreated": "Utilizator creat cu succes",
    "loginSuccessful": "Conectare reușită"
  }
}
```

## API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Utilizator creat cu succes", // Localized
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Email-ul există deja!" // Localized
}
```

## Testing

Test endpoints are available for development:

```bash
# Test success message (English)
GET /test/test-i18n
Headers: Accept-Language-Preference: en

# Test success message (Romanian)  
GET /test/test-i18n
Headers: Accept-Language-Preference: ro

# Test error message
GET /test/test-error
Headers: Accept-Language-Preference: ro
```

## Adding New Translations

1. Add the translation key to both language files:
   - `src/i18n/locales/en/translation.json`
   - `src/i18n/locales/ro/translation.json`

2. Use the translation in your controller:
   ```typescript
   ApiResponse.success(req, res, data, 'success.newTranslationKey');
   // or
   throw new ApiError(400, "Default message", 'errors.newErrorKey');
   ```

## Migration from Old Code

Replace old response patterns:

```typescript
// Old
res.status(404).json({ message: 'User not found' });

// New
throw ApiError.userNotFound();
```

```typescript
// Old
res.json({ success: true, data: user });

// New
ApiResponse.userCreated(req, res, user);
```

## Implementation Status

### ✅ Completed

1. **I18n Infrastructure Setup**
   - ✅ Installed i18next, i18next-fs-backend, i18next-http-middleware
   - ✅ Created i18n configuration (`src/i18n/i18n.ts`)
   - ✅ Created i18n utilities (`src/i18n/utils.ts`)
   - ✅ Added language detection middleware
   - ✅ Created translation files (English & Romanian)

2. **Error Handling System**
   - ✅ Created `LocalizedApiError` class for localized error responses
   - ✅ Created `ApiResponse` utility for localized success responses
   - ✅ Updated global error handler to use i18n
   - ✅ Updated all controllers to use new error system

3. **Controllers & Services**
   - ✅ Updated user controller (auth, profile, settings, password reset)
   - ✅ Updated admin controller (user management, dashboard)
   - ✅ Updated comment controller (CRUD operations)
   - ✅ Updated like controller (like/unlike operations)
   - ✅ Updated notification service (all notification types)
   - ✅ Updated notification controller (read/delete operations)

4. **Email Internationalization**
   - ✅ Internationalized password reset emails
   - ✅ Added email templates for English & Romanian
   - ✅ User language-specific email sending

5. **Translation Coverage**
   - ✅ Complete error messages (40+ keys)
   - ✅ Success messages (20+ keys)
   - ✅ Notification messages (18+ keys)
   - ✅ Validation messages (8+ keys)
   - ✅ Email templates (3 types)
   - ✅ Both English and Romanian translations

6. **Integration & Testing**
   - ✅ Server middleware setup
   - ✅ Test routes for i18n verification
   - ✅ TypeScript compilation verified
   - ✅ No linting errors

### 🎯 Implementation Summary

The backend internationalization is now **fully complete** with:

- **Full i18n infrastructure** with automatic language detection
- **Comprehensive error handling** with localized messages
- **User-specific localization** based on user settings
- **Email internationalization** with user language preferences
- **Complete translation coverage** for all user-facing messages
- **Consistent API responses** with proper localization
- **Type-safe implementation** with full TypeScript support

All backend controllers, services, and utilities now support internationalization with proper language detection and user-specific message localization.
