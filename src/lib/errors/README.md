# Error Handling Framework

A comprehensive, centralized error handling system for the Spanish Tutor application that provides consistent error management, user-friendly messaging, and robust recovery mechanisms.

## Overview

This framework provides:
- **Custom error classes** for different error categories
- **Centralized error handling** with automatic logging and reporting
- **User-friendly error messages** that don't expose technical details
- **Error recovery strategies** including retry mechanisms
- **React error boundaries** with enhanced functionality
- **Hooks and utilities** for common error handling patterns

## Quick Start

### Basic Usage

```typescript
import { handleError, ApiError, createPracticeSessionError } from '@/lib/errors'

// Handle API errors
try {
  const response = await fetch('/api/conversations')
  if (!response.ok) {
    throw new ApiError('Failed to fetch conversations', response.status)
  }
} catch (error) {
  const appError = handleError(error)
  // Error is automatically logged and processed
}

// Create specific error types
const sessionError = createPracticeSessionError(
  'Failed to initialize practice session',
  'realtime',
  'failed',
  { userId: 'user123', sessionId: 'session456' }
)
```

### Using React Hooks

```typescript
import { useErrorHandler, useRetryableOperation } from '@/lib/errors'

function MyComponent() {
  const { handleError, lastError, clearError } = useErrorHandler()
  
  const { execute, retry, isLoading, error, canRetry } = useRetryableOperation(
    async () => {
      // Your async operation here
      return await fetchData()
    }
  )

  // Handle errors in event handlers
  const handleSubmit = async () => {
    try {
      await submitForm()
    } catch (err) {
      handleError(err, { component: 'MyComponent', action: 'submit' })
    }
  }
}
```

### Initializing Error Handling

```typescript
// In your app initialization (e.g., _app.tsx or main.tsx)
import { initializeErrorHandling } from '@/lib/errors'
import { toast } from 'your-toast-library'
import { useRouter } from 'next/router'

function App() {
  const router = useRouter()
  
  useEffect(() => {
    initializeErrorHandling(
      (message, type) => toast[type](message), // Toast notifications
      (path) => router.push(path) // Navigation
    )
  }, [])
}
```

## Error Types

### Core Error Categories

- **ApiError**: HTTP API request failures
- **AuthError**: Authentication and authorization issues
- **WebRTCError**: Real-time communication connection problems
- **AudioError**: Microphone, playback, or audio processing issues
- **NetworkError**: Network connectivity problems
- **ValidationError**: Form validation and input validation errors

### Spanish Tutor Specific Errors

- **PracticeSessionError**: Practice session management issues
- **NPCError**: AI tutor/NPC related problems
- **ProgressError**: Learning progress tracking issues
- **ModuleError**: Learning module issues
- **ConversationAnalysisError**: Spanish conversation analysis failures
- **RealtimeAPIError**: OpenAI Realtime API specific errors
- **DatabaseError**: Supabase/database operation failures

### Error Severity Levels

- **LOW**: Minor issues that don't affect core functionality
- **MEDIUM**: Issues that degrade user experience
- **HIGH**: Issues that break key features
- **CRITICAL**: Issues that make the app unusable

## Common Patterns

### API Error Handling

```typescript
import { handleApiResponse, ApiError } from '@/lib/errors'

async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`)
    return await handleApiResponse(response, `/api/users/${userId}`)
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      // Handle specific error cases
      return null
    }
    throw error // Re-throw for global error handling
  }
}
```

### WebRTC Connection Handling

```typescript
import { handleWebRTCConnectionState } from '@/lib/errors'

// In your WebRTC connection handler
pc.onconnectionstatechange = () => {
  const error = handleWebRTCConnectionState(
    pc.connectionState,
    pc.iceConnectionState,
    (appError) => {
      // Handle the error (show toast, retry, etc.)
      console.error('WebRTC error:', appError.userMessage)
    }
  )
}
```

### Audio Permission Handling

```typescript
import { handleAudioPermissions } from '@/lib/errors'

async function setupMicrophone() {
  const stream = await handleAudioPermissions((error) => {
    // Show user-friendly error message
    setErrorMessage(error.userMessage)
    setShowPermissionHelp(true)
  })
  
  if (stream) {
    // Use the media stream
  }
}
```

### Form Validation

```typescript
import { handleFormValidationErrors, ValidationError } from '@/lib/errors'

function validateForm(data: FormData) {
  const errors: Record<string, string[]> = {}
  
  if (!data.email) {
    errors.email = ['Email is required']
  }
  
  if (Object.keys(errors).length > 0) {
    const validationErrors = handleFormValidationErrors(errors)
    // Display errors to user
  }
}
```

## Error Boundaries

The framework includes enhanced error boundaries that work with the error handling system:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ApiErrorBoundary } from '@/components/error-boundaries/ApiErrorBoundary'

// Main app error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// API-specific error boundary
<ApiErrorBoundary onRetry={() => refetch()}>
  <ApiComponent />
</ApiErrorBoundary>
```

## Error Recovery

### Automatic Retry

```typescript
import { useRetryableOperation } from '@/lib/errors'

const { execute, retry, isLoading, error, canRetry } = useRetryableOperation(
  async () => await apiCall(),
  3, // max retries
  [1000, 2000, 5000] // retry delays
)

// In your JSX
{error && canRetry && (
  <button onClick={retry}>Try Again</button>
)}
```

### Manual Error Recovery

```typescript
import { useErrorRecovery } from '@/lib/errors'

const { recover } = useErrorRecovery()

// Apply recovery strategies based on error type
if (error instanceof WebRTCError) {
  recover(error) // Clears WebRTC state
}
```

## Testing Error Handling

### Mock Errors in Tests

```typescript
import { createPracticeSessionError, COMMON_ERRORS } from '@/lib/errors'

// Use predefined common errors
const sessionError = COMMON_ERRORS.SESSION_START_FAILED

// Create specific test errors
const testError = createPracticeSessionError(
  'Test session failure',
  'realtime',
  'failed',
  { testContext: true }
)
```

### Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

test('error boundary catches errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  )
  
  expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
})
```

## Best Practices

### 1. Choose the Right Error Type

- Use specific error types (e.g., `AuthError` for auth issues)
- Include relevant context in error objects
- Set appropriate severity levels

### 2. Provide Helpful User Messages

- Write user-friendly messages that explain what happened
- Avoid technical jargon
- Suggest actionable next steps

### 3. Make Errors Recoverable When Possible

- Mark errors as retryable when appropriate
- Provide clear recovery actions
- Implement graceful degradation

### 4. Log Errors Appropriately

- Include sufficient context for debugging
- Respect user privacy (don't log sensitive data)
- Use appropriate log levels

### 5. Test Error Scenarios

- Test both happy path and error scenarios
- Verify error boundaries work correctly
- Test error recovery mechanisms

## Configuration

### Error Logging

The framework integrates with the existing error logging system. Errors are automatically logged with:
- Error details and stack traces
- User context and session information
- Component and action context
- Severity and category information

### Error Reporting

In production, errors can be sent to external services:

```typescript
// In your error logging configuration
if (process.env.NODE_ENV === 'production') {
  // Configure Sentry, LogRocket, or other error tracking
}
```

## Migration Guide

### From Manual Error Handling

Before:
```typescript
try {
  await apiCall()
} catch (error) {
  console.error('API failed:', error)
  setError('Something went wrong')
}
```

After:
```typescript
try {
  await apiCall()
} catch (error) {
  const appError = handleError(error, { component: 'MyComponent' })
  setError(appError.userMessage)
}
```

### From Basic Error Boundaries

Update your error boundaries to use the new framework for enhanced functionality and consistent error handling across the application.

## Troubleshooting

### Common Issues

1. **Errors not being caught**: Ensure error boundaries are properly placed in your component tree
2. **Missing error context**: Always provide context when handling errors
3. **Incorrect error types**: Use the most specific error type available
4. **Not handling async errors**: Use proper error handling in async operations

### Debug Mode

In development, errors include detailed information in the UI. Check the browser console for full error details and stack traces.