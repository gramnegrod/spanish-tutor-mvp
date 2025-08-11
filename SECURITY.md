# Security Guidelines for Spanish Tutor MVP

## Overview

This document outlines the security measures implemented in the Spanish Tutor MVP application and provides guidelines for maintaining security.

## Security Features Implemented

### 1. Input Validation and Sanitization
- All API routes use Zod schema validation
- Text inputs are sanitized to remove control characters and prevent XSS
- File uploads are validated for size and type
- Request body sizes are limited to prevent abuse

### 2. Authentication and Authorization
- All protected API routes require authentication via Supabase
- User ownership is verified for resources (conversations, progress, etc.)
- Session management handled by Supabase Auth

### 3. Rate Limiting
- In-memory rate limiting implemented for all API routes
- Different limits for different operations:
  - Registration: 5 requests per 15 minutes
  - Session creation: 20 requests per minute
  - Analysis operations: 20-30 requests per minute
  - General queries: 60 requests per minute

### 4. Security Headers
- Comprehensive security headers applied via middleware:
  - Content Security Policy (CSP)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy: strict-origin-when-cross-origin

### 5. CORS Protection
- CORS validation for all API routes
- Configurable allowed origins via environment variables

### 6. API Security Wrapper
- All API routes wrapped with `withSecurity` function
- Provides consistent security checks across all endpoints
- Handles errors gracefully without exposing internals

## Best Practices

### Environment Variables
1. Never commit `.env.local` or any file containing secrets
2. Use `.env.example` as a template
3. Keep API keys server-side only (remove NEXT_PUBLIC prefix)
4. Rotate keys regularly

### API Development
1. Always use the security wrapper for new API routes:
   ```typescript
   export const POST = withSecurity(handler, {
     rateLimit: { windowMs: 60000, maxRequests: 30 },
     maxBodySize: 1024 * 1024, // 1MB
     requireAuth: true
   })
   ```

2. Define Zod schemas for all inputs:
   ```typescript
   const schema = z.object({
     field: z.string().max(100).transform(sanitizeText)
   })
   ```

3. Verify resource ownership:
   ```typescript
   if (resource.user_id !== user.id) {
     return createSecureResponse({ error: 'Access denied' }, { status: 403 })
   }
   ```

### Data Handling
1. Sanitize all user inputs before processing
2. Limit array sizes and string lengths
3. Use parameterized queries (Supabase handles this)
4. Never log sensitive data (passwords, API keys, etc.)

### Error Handling
1. Use generic error messages for clients
2. Log detailed errors server-side only
3. Never expose stack traces or internal details

## Security Checklist for New Features

- [ ] Input validation with Zod schemas
- [ ] Authentication check for protected resources
- [ ] Resource ownership verification
- [ ] Rate limiting configured appropriately
- [ ] Request size limits set
- [ ] Output sanitization if returning user data
- [ ] Error messages are generic
- [ ] No sensitive data in logs
- [ ] Security headers applied
- [ ] CORS properly configured

## Incident Response

If a security issue is discovered:

1. Immediately rotate affected credentials
2. Review logs for suspicious activity
3. Patch the vulnerability
4. Document the incident and resolution
5. Update security measures as needed

## Future Enhancements

Consider implementing:
- Redis-based rate limiting for production
- API key rotation system
- Request signing for critical operations
- Audit logging for sensitive operations
- Web Application Firewall (WAF)
- DDoS protection
- Automated security scanning in CI/CD

## Security Contacts

For security concerns, contact:
- Development Team: [email]
- Security Team: [email]

Report security vulnerabilities responsibly via private channels.