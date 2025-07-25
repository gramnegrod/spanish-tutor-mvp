/**
 * Test script to demonstrate improved reconnection logic
 * This script shows how the service handles various disconnection scenarios
 */

// Mock implementation for testing
class MockOpenAIRealtimeService {
  constructor(config) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 3,
      debug: true,
      ...config
    };
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.isManualDisconnect = false;
    this.isReconnecting = false;
    this.isDisposed = false;
    this.status = 'disconnected';
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async connect() {
    if (this.status !== 'disconnected') {
      throw new Error(`Cannot connect in ${this.status} state`);
    }

    // Reset manual disconnect flag
    this.isManualDisconnect = false;
    
    this.log('Connecting...');
    this.status = 'connecting';

    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure
    const success = Math.random() > 0.3; // 70% success rate
    
    if (success) {
      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      
      // Clear any pending reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      this.log('Connected successfully!');
      
      // Simulate random disconnect after 5-10 seconds
      setTimeout(() => {
        if (this.status === 'connected' && !this.isManualDisconnect) {
          this.handleDisconnect('Network error');
        }
      }, 5000 + Math.random() * 5000);
    } else {
      throw new Error('Connection failed');
    }
  }

  async disconnect() {
    this.log('Manual disconnect requested');
    
    // Mark as manual disconnect
    this.isManualDisconnect = true;
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Reset reconnection state
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    this.status = 'disconnected';
    this.log('Disconnected');
  }

  handleDisconnect(reason) {
    this.status = 'disconnected';
    this.log(`Disconnected: ${reason}`);
    
    // Check if we should reconnect
    if (this.config.autoReconnect && 
        !this.isManualDisconnect &&
        !this.isReconnecting &&
        this.reconnectAttempts < this.config.maxReconnectAttempts &&
        reason !== 'User requested disconnect' &&
        !this.isDisposed) {
      this.scheduleReconnect();
    } else {
      this.log('Not attempting reconnection');
      if (this.isManualDisconnect) this.log('  - Manual disconnect');
      if (this.isReconnecting) this.log('  - Already reconnecting');
      if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        this.log('  - Max attempts reached');
      }
    }
  }

  scheduleReconnect() {
    // Prevent multiple simultaneous reconnection attempts
    if (this.isReconnecting || this.reconnectTimer) {
      this.log('Reconnection already in progress, skipping...');
      return;
    }
    
    this.reconnectAttempts++;
    this.isReconnecting = true;
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
    const jitter = Math.random() * 0.3 * baseDelay;
    const delay = Math.floor(baseDelay + jitter);
    
    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      // Double-check we should still reconnect
      if (this.isDisposed || this.isManualDisconnect) {
        this.log('Reconnection cancelled (disposed or manual disconnect)');
        this.isReconnecting = false;
        return;
      }
      
      try {
        await this.connect();
      } catch (error) {
        this.log(`Reconnect failed: ${error.message}`);
        this.isReconnecting = false;
        
        // Schedule next attempt if applicable
        if (this.reconnectAttempts < this.config.maxReconnectAttempts && 
            !this.isManualDisconnect && 
            !this.isDisposed) {
          this.scheduleReconnect();
        } else {
          this.log('Max reconnection attempts reached or service disposed');
        }
      }
    }, delay);
  }

  dispose() {
    this.isDisposed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    this.log('Service disposed');
  }
}

// Test scenarios
async function runTests() {
  console.log('=== Testing Improved Reconnection Logic ===\n');

  // Test 1: Auto-reconnection after network failure
  console.log('Test 1: Auto-reconnection after network failure');
  console.log('-'.repeat(50));
  const service1 = new MockOpenAIRealtimeService({ maxReconnectAttempts: 3 });
  await service1.connect();
  
  // Wait for auto-disconnect and reconnection attempts
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  console.log('\n');

  // Test 2: Manual disconnect prevents reconnection
  console.log('Test 2: Manual disconnect prevents reconnection');
  console.log('-'.repeat(50));
  const service2 = new MockOpenAIRealtimeService({ maxReconnectAttempts: 3 });
  await service2.connect();
  
  // Manual disconnect after 3 seconds
  setTimeout(() => service2.disconnect(), 3000);
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('\n');

  // Test 3: Dispose during reconnection
  console.log('Test 3: Dispose during reconnection');
  console.log('-'.repeat(50));
  const service3 = new MockOpenAIRealtimeService({ maxReconnectAttempts: 5 });
  
  // Force immediate disconnect
  service3.connect().catch(() => {});
  setTimeout(() => service3.handleDisconnect('Test disconnect'), 1500);
  
  // Dispose during reconnection
  setTimeout(() => service3.dispose(), 4000);
  
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  console.log('\n=== Tests Complete ===');
}

// Run tests
runTests().catch(console.error);