/**
 * Simple ID generation utilities
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  // Use native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  
  // Simple fallback
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a message ID
 */
export function generateMessageId(): string {
  return generateId('msg');
}