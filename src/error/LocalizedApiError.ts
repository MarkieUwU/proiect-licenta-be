import type { Request } from 'express';
import { tReq } from '../i18n/utils';

export class ApiError extends Error {
  code: number;
  status: string;
  translationKey?: string;
  translationOptions?: { [key: string]: any };

  constructor(
    code: number, 
    message: string, 
    translationKey?: string, 
    translationOptions?: { [key: string]: any }
  ) {
    super(message);
    this.code = code;
    this.status = code >= 400 && code < 500 ? "fail" : "error";
    this.translationKey = translationKey;
    this.translationOptions = translationOptions;
  }

  /**
   * Get the localized message for this error
   */
  getLocalizedMessage(req: Request): string {
    if (this.translationKey) {
      return tReq(req, this.translationKey, this.translationOptions);
    }
    return this.message;
  }

  static badRequest(msg: string = "Bad Request", translationKey?: string, translationOptions?: { [key: string]: any }) {
    return new ApiError(400, msg, translationKey || 'errors.badRequest', translationOptions);
  }

  static unauthorized(msg: string = "Authentication Failed", translationKey?: string, translationOptions?: { [key: string]: any }) {
    return new ApiError(401, msg, translationKey || 'errors.authenticationFailed', translationOptions);
  }

  static forbidden(msg: string = "Forbidden", translationKey?: string, translationOptions?: { [key: string]: any }) {
    return new ApiError(403, msg, translationKey || 'errors.forbidden', translationOptions);
  }

  static notFound(msg: string, translationKey?: string, translationOptions?: { [key: string]: any }) {
    return new ApiError(404, msg, translationKey || 'errors.resourceNotFound', translationOptions);
  }

  static internal(msg: string, translationKey?: string, translationOptions?: { [key: string]: any }) {
    return new ApiError(500, msg, translationKey || 'errors.internalServerError', translationOptions);
  }

  // Specific error methods with translation keys
  static userNotFound(req?: Request) {
    return new ApiError(404, "User not found", 'errors.userNotFound');
  }

  static invalidRole(req?: Request) {
    return new ApiError(400, "Invalid role", 'errors.invalidRole');
  }

  static bothUsernameEmailExist(req?: Request) {
    return new ApiError(400, "Both username and email already exist!", 'errors.bothUsernameEmailExist');
  }

  static emailAlreadyExists(req?: Request) {
    return new ApiError(400, "Email already exists!", 'errors.emailAlreadyExists');
  }

  static usernameAlreadyExists(req?: Request) {
    return new ApiError(400, "Username already exists!", 'errors.usernameAlreadyExists');
  }

  static passwordsDontMatch(req?: Request) {
    return new ApiError(400, "Passwords don't match", 'errors.passwordsDontMatch');
  }

  static jwtSecretNotSet(req?: Request) {
    return new ApiError(500, "JWT secret is not set", 'errors.jwtSecretNotSet');
  }

  static resetJwtSecretNotSet(req?: Request) {
    return new ApiError(500, "Reset JWT secret is not set", 'errors.resetJwtSecretNotSet');
  }

  static usernameOrPasswordIncorrect(req?: Request) {
    return new ApiError(401, "Username or password is incorrect", 'errors.usernameOrPasswordIncorrect');
  }

  static passwordResetLinkExpired(req?: Request) {
    return new ApiError(401, "Password reset link has expired.", 'errors.passwordResetLinkExpired');
  }

  static passwordResetLinkInvalid(req?: Request) {
    return new ApiError(401, "Password reset link is invalid.", 'errors.passwordResetLinkInvalid');
  }

  static notificationNotFound(req?: Request) {
    return new ApiError(404, "Notification not found", 'errors.notificationNotFound');
  }

  static cannotDeleteUnreadNotifications(req?: Request) {
    return new ApiError(400, "Cannot delete unread notifications", 'errors.cannotDeleteUnreadNotifications');
  }

  static postNotFound(req?: Request) {
    return new ApiError(404, "Post not found", 'errors.postNotFound');
  }

  static commentNotFound(req?: Request) {
    return new ApiError(404, "Comment not found", 'errors.commentNotFound');
  }

  static cannotLikeOwnPost(req?: Request) {
    return new ApiError(400, "Cannot like your own post", 'errors.cannotLikeOwnPost');
  }

  static alreadyLikedPost(req?: Request) {
    return new ApiError(400, "You have already liked this post", 'errors.alreadyLikedPost');
  }

  static postAlreadyReported(req?: Request) {
    return new ApiError(400, "Post already reported", 'errors.postAlreadyReported');
  }

  static commentAlreadyReported(req?: Request) {
    return new ApiError(400, "Comment already reported", 'errors.commentAlreadyReported');
  }

  static cannotFollowYourself(req?: Request) {
    return new ApiError(400, "Cannot follow yourself", 'errors.cannotFollowYourself');
  }

  static alreadyFollowing(req?: Request) {
    return new ApiError(400, "Already following this user", 'errors.alreadyFollowing');
  }

  static notFollowing(req?: Request) {
    return new ApiError(400, "Not following this user", 'errors.notFollowing');
  }

  static connectionRequestNotFound(req?: Request) {
    return new ApiError(404, "Connection request not found", 'errors.connectionRequestNotFound');
  }

  static alreadyConnected(req?: Request) {
    return new ApiError(400, "Already connected to this user", 'errors.alreadyConnected');
  }

  static connectionRequestAlreadySent(req?: Request) {
    return new ApiError(400, "Connection request already sent", 'errors.connectionRequestAlreadySent');
  }
}
