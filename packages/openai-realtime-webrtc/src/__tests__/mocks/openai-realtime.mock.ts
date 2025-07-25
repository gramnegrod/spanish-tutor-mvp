/**
 * Mock for @openai/realtime-api-beta package
 * Used when testing components that might reference the original API
 */

export class RealtimeClient {
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): void {
    this.connected = false;
    this.emit('disconnected');
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: any[]): void {
    this.eventHandlers.get(event)?.forEach(handler => handler(...args));
  }

  sendUserMessageContent(_content: any[]): void {
    // Mock implementation
  }

  createResponse(): void {
    // Mock implementation
  }

  updateSession(_config: any): void {
    // Mock implementation
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export class RealtimeConversation {
  private items: any[] = [];

  getItems(): any[] {
    return this.items;
  }

  addItem(item: any): void {
    this.items.push(item);
  }

  clear(): void {
    this.items = [];
  }
}

export class RealtimeResponse {
  private inProgress = false;

  cancel(): void {
    this.inProgress = false;
  }

  isInProgress(): boolean {
    return this.inProgress;
  }

  start(): void {
    this.inProgress = true;
  }
}

// Export mock utilities
export const RealtimeUtils = {
  WavRecorder: class {
    record() {}
    pause() {}
    stop() {}
    getFrequencies() { return new Float32Array(128); }
  },
  
  WavStreamPlayer: class {
    play() {}
    pause() {}
    stop() {}
    getFrequencies() { return new Float32Array(128); }
  }
};