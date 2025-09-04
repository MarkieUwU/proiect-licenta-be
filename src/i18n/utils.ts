import type { Request } from 'express';
import i18n from './i18n';

/**
 * Get the preferred language from request headers or default to English
 */
export const getLanguageFromRequest = (req: Request): string => {
  // Check for explicit language header (from frontend)
  const explicitLang = req.headers['accept-language-preference'] as string;
  if (explicitLang && ['en', 'ro'].includes(explicitLang)) {
    return explicitLang;
  }

  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    // Parse accept-language header (e.g., "ro-RO,ro;q=0.9,en;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].split('-')[0].trim())
      .filter(lang => ['en', 'ro'].includes(lang));
    
    if (languages.length > 0) {
      return languages[0];
    }
  }

  // Default to English
  return 'en';
};

/**
 * Get translated message with interpolation
 */
export const t = (key: string, options?: { lng?: string; [key: string]: any }): string => {
  return i18n.t(key, options);
};

/**
 * Get translated message for a specific request
 */
export const tReq = (req: Request, key: string, options?: { [key: string]: any }): string => {
  const lng = getLanguageFromRequest(req);
  return i18n.t(key, { lng, ...options });
};

/**
 * Initialize i18n for the request middleware
 */
export const initI18nMiddleware = () => {
  return (req: Request, res: any, next: any) => {
    const language = getLanguageFromRequest(req);
    req.language = language;
    next();
  };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      language?: string;
    }
  }
}
