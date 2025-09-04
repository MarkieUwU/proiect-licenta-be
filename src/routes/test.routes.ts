import express from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../error/LocalizedApiError';

const router = express.Router();

// Test endpoint for internationalization
router.get('/test-i18n', (req, res, next) => {
  try {
    // Test success message
    ApiResponse.success(req, res, { test: 'data' }, 'success.operationCompleted');
  } catch (error) {
    next(error);
  }
});

// Test endpoint for error messages
router.get('/test-error', (req, res, next) => {
  // Test error message
  next(ApiError.userNotFound());
});

export default router;
