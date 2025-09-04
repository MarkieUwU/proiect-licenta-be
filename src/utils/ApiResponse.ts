import type { Request, Response } from 'express';
import { tReq } from '../i18n/utils';

export class ApiResponse {
  /**
   * Send a success response with localized message
   */
  static success(
    req: Request,
    res: Response,
    data?: any,
    messageKey?: string,
    translationOptions?: { [key: string]: any },
    statusCode: number = 200
  ) {
    const response: any = {
      status: 'success',
      ...(data && { data }),
    };

    if (messageKey) {
      response.message = tReq(req, messageKey, translationOptions);
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201) with localized message
   */
  static created(
    req: Request,
    res: Response,
    data?: any,
    messageKey?: string,
    translationOptions?: { [key: string]: any }
  ) {
    return ApiResponse.success(req, res, data, messageKey, translationOptions, 201);
  }

  /**
   * Send an error response with localized message
   */
  static error(
    req: Request,
    res: Response,
    error: any,
    statusCode: number = 500
  ) {
    let message = 'Internal Server Error';
    
    if (error.getLocalizedMessage && typeof error.getLocalizedMessage === 'function') {
      message = error.getLocalizedMessage(req);
    } else if (error.translationKey) {
      message = tReq(req, error.translationKey, error.translationOptions);
    } else if (error.message) {
      message = error.message;
    }

    return res.status(statusCode).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Specific success response methods
  static userCreated(req: Request, res: Response, data?: any) {
    return ApiResponse.created(req, res, data, 'success.userCreated');
  }

  static userUpdated(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.userUpdated');
  }

  static userDeleted(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.userDeleted');
  }

  static postCreated(req: Request, res: Response, data?: any) {
    return ApiResponse.created(req, res, data, 'success.postCreated');
  }

  static postUpdated(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.postUpdated');
  }

  static postDeleted(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.postDeleted');
  }

  static commentCreated(req: Request, res: Response, data?: any) {
    return ApiResponse.created(req, res, data, 'success.commentCreated');
  }

  static commentUpdated(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.commentUpdated');
  }

  static commentDeleted(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.commentDeleted');
  }

  static likeAdded(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.likeAdded');
  }

  static likeRemoved(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.likeRemoved');
  }

  static connectionRequestSent(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.connectionRequestSent');
  }

  static connectionRequestAccepted(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.connectionRequestAccepted');
  }

  static connectionRequestDeclined(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.connectionRequestDeclined');
  }

  static connectionRemoved(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.connectionRemoved');
  }

  static reportSubmitted(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.reportSubmitted');
  }

  static notificationMarkedAsRead(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.notificationMarkedAsRead');
  }

  static notificationDeleted(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.notificationDeleted');
  }

  static passwordResetEmailSent(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.passwordResetEmailSent');
  }

  static passwordResetSuccessful(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.passwordResetSuccessful');
  }

  static settingsUpdated(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.settingsUpdated');
  }

  static profileUpdated(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.profileUpdated');
  }

  static loginSuccessful(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.loginSuccessful');
  }

  static logoutSuccessful(req: Request, res: Response) {
    return ApiResponse.success(req, res, null, 'success.logoutSuccessful');
  }

  static operationCompleted(req: Request, res: Response, data?: any) {
    return ApiResponse.success(req, res, data, 'success.operationCompleted');
  }
}
