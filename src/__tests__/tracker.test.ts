import { ArgosTracker } from '../tracker';
import { EventType, ReportMethod } from '../constants';
import { TrackerConfig } from '../types';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  value: jest.fn(),
  writable: true,
});

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('ArgosTracker', () => {
  let tracker: ArgosTracker;
  let mockConfig: TrackerConfig;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    mockConfig = {
      reportUrl: 'https://api.example.com/track',
      appId: 'test-app',
      userId: 'test-user',
      debug: true,
      reportMethod: ReportMethod.IMMEDIATE,
      autoTrackPageView: false,
      autoTrackClick: false,
      autoTrackError: false
    };

    // Mock fetch to resolve successfully
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });
  });

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with provided config', () => {
      tracker = new ArgosTracker(mockConfig);
      
      expect(tracker.getUserId()).toBe('test-user');
      expect(tracker.getSessionId()).toBeDefined();
      expect(tracker.getConfig().appId).toBe('test-app');
    });

    it('should generate session ID if not provided', () => {
      tracker = new ArgosTracker(mockConfig);
      
      const sessionId = tracker.getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      tracker = new ArgosTracker(mockConfig);
    });

    it('should track custom events', async () => {
      const eventName = 'button_click';
      const properties = { button_id: 'submit-btn', page: 'checkout' };
      
      tracker.track(eventName, properties);
      
      // Wait for immediate report
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalledWith(
        mockConfig.reportUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(eventName)
        })
      );
    });

    it('should track page view events', async () => {
      const properties = { campaign: 'summer-sale' };
      
      tracker.trackPageView(properties);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody.events[0].event_name).toBe('page_view');
      const customProperties = JSON.parse(requestBody.events[0].custom_properties);
      expect(customProperties.campaign).toBe('summer-sale');
    });

    it('should track user actions', async () => {
      const actionName = 'form_submit';
      const properties = { form_type: 'contact', fields: 3 };
      
      tracker.trackUserAction(actionName, properties);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalled();
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody.events[0].event_name).toBe(actionName);
      const customProperties = JSON.parse(requestBody.events[0].custom_properties);
      expect(customProperties.form_type).toBe('contact');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      tracker = new ArgosTracker(mockConfig);
    });

    it('should set user information', async () => {
      const userInfo = {
        userId: 'new-user-123',
        properties: { name: 'John Doe', email: 'john@example.com' }
      };
      
      tracker.setUser(userInfo);
      
      expect(tracker.getUserId()).toBe('new-user-123');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should clear user information', async () => {
      tracker.clearUser();
      
      expect(tracker.getUserId()).toBeUndefined();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Batch Reporting', () => {
    beforeEach(() => {
      mockConfig.reportMethod = ReportMethod.BATCH;
      mockConfig.batchSize = 3;
      mockConfig.batchInterval = 1000;
      tracker = new ArgosTracker(mockConfig);
    });

    it('should batch events and send when batch size is reached', async () => {
      // Track 3 events to trigger batch send
      tracker.track('event1');
      tracker.track('event2');
      tracker.track('event3');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody.events).toHaveLength(3);
    });

    it('should send batched events after interval', async () => {
      tracker.track('event1');
      tracker.track('event2');
      
      // Should not send immediately
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Wait for batch interval
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(() => {
      tracker = new ArgosTracker(mockConfig);
    });

    it('should update configuration', () => {
      const newConfig = {
        userId: 'updated-user',
        debug: false
      };
      
      tracker.updateConfig(newConfig);
      
      expect(tracker.getUserId()).toBe('updated-user');
      expect(tracker.getConfig().debug).toBe(false);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      tracker = new ArgosTracker(mockConfig);
    });

    it('should renew session ID', () => {
      const originalSessionId = tracker.getSessionId();
      const newSessionId = tracker.renewSession();
      
      expect(newSessionId).not.toBe(originalSessionId);
      expect(tracker.getSessionId()).toBe(newSessionId);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      tracker = new ArgosTracker(mockConfig);
    });

    it('should handle network errors gracefully', async () => {
      // Mock fetch to reject
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      tracker.track('test_event');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not throw error
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle HTTP errors gracefully', async () => {
      // Mock fetch to return error response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      tracker.track('test_event');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});