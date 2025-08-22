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

// Mock global fetch
global.fetch = jest.fn();

// Mock sendBeacon
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

describe('API Monitoring Tests', () => {
  let tracker: ArgosTracker;
  let mockConfig: TrackerConfig;
  let mockFetch: jest.Mock;
  let originalXHR: typeof XMLHttpRequest;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Save original implementations
    originalXHR = global.XMLHttpRequest;
    originalFetch = global.fetch;
    
    mockConfig = {
      reportUrl: 'https://api.example.com/track',
      appId: 'test-app',
      userId: 'test-user',
      debug: true,
      reportMethod: ReportMethod.IMMEDIATE,
      autoTrackApi: true
    };

    // Create mock fetch
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK'
    });
    global.fetch = mockFetch;
    
    // Create tracker with API monitoring enabled
    tracker = new ArgosTracker(mockConfig);
  });

  afterEach(() => {
    if (tracker) {
      tracker.destroy();
    }
    // Restore original implementations
    global.XMLHttpRequest = originalXHR;
    global.fetch = originalFetch;
  });

  describe('Fetch API Monitoring', () => {
    it('should monitor successful fetch requests', async () => {
      // Mock successful fetch response with delay to ensure duration > 0
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-length': '100' }),
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('test response')
        })
      };

      // Update mockFetch to handle multiple calls with delay
      mockFetch.mockReset()
        .mockImplementationOnce(() => 
          new Promise(resolve => setTimeout(() => resolve(mockResponse), 10))
        ) // For the API call with delay
        .mockResolvedValue({ ok: true, status: 200 }); // For the tracking call
      
      // Make a fetch request
      await fetch('https://api.example.com/users', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // Wait for tracking to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify tracking call was made
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Check the tracking call
      const trackingCall = mockFetch.mock.calls[1];
      expect(trackingCall[0]).toBe('https://api.example.com/track');
      
      const requestBody = JSON.parse(trackingCall[1].body);
      expect(requestBody.events).toBeDefined();
      expect(requestBody.events.length).toBeGreaterThan(0);
      
      const event = requestBody.events[0];
      expect(event.event_name).toBe('api_request');
      
      const customProperties = JSON.parse(event.custom_properties);
      expect(customProperties.url).toBe('https://api.example.com/users');
      expect(customProperties.method).toBe('GET');
      expect(customProperties.success).toBe(true);
      expect(customProperties.statusCode).toBe(200);
      expect(customProperties.duration).toBeGreaterThan(0);
    });

    it('should monitor failed fetch requests', async () => {
      // Mock failed fetch response
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockResolvedValue('Not found')
        })
      };

      mockFetch.mockReset()
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValue({ ok: true, status: 200 });
      
      await fetch('https://api.example.com/nonexistent', { method: 'GET' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      const trackingCall = mockFetch.mock.calls[1];
      const requestBody = JSON.parse(trackingCall[1].body);
      const event = requestBody.events[0];
      const customProperties = JSON.parse(event.custom_properties);
      
      expect(customProperties.success).toBe(false);
      expect(customProperties.statusCode).toBe(404);
      expect(customProperties.errorMessage).toBe('Not Found');
    });

    it('should monitor fetch network errors', async () => {
      mockFetch.mockReset()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ ok: true, status: 200 });
      
      try {
        await fetch('https://api.example.com/test');
      } catch (error) {
        // Expected to fail
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      const trackingCall = mockFetch.mock.calls[1];
      const requestBody = JSON.parse(trackingCall[1].body);
      const event = requestBody.events[0];
      const customProperties = JSON.parse(event.custom_properties);
      
      expect(customProperties.success).toBe(false);
      expect(customProperties.errorMessage).toBe('Network error');
    });
  });

  describe('XMLHttpRequest Monitoring', () => {
    it('should monitor successful XMLHttpRequest', async () => {
      // Create XMLHttpRequest instance
      const xhr = new XMLHttpRequest();
      
      // Mock XMLHttpRequest behavior
      const openSpy = jest.spyOn(xhr, 'open');
      const sendSpy = jest.spyOn(xhr, 'send');
      
      // Simulate successful request
      xhr.open('POST', 'https://api.example.com/data');
      xhr.send(JSON.stringify({ test: 'data' }));
      
      // Simulate response
      Object.defineProperty(xhr, 'status', { value: 201, writable: true });
      Object.defineProperty(xhr, 'statusText', { value: 'Created', writable: true });
      Object.defineProperty(xhr, 'responseText', { value: '{"id": 123}', writable: true });
      Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
      
      // Trigger readystatechange event
      const event = new Event('readystatechange');
      xhr.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();
      
      const trackingCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(trackingCall[1].body);
      const trackedEvent = requestBody.events[0];
      const customProperties = JSON.parse(trackedEvent.custom_properties);
      
      expect(customProperties.url).toBe('https://api.example.com/data');
      expect(customProperties.method).toBe('POST');
      expect(customProperties.success).toBe(true);
      expect(customProperties.statusCode).toBe(201);
      expect(customProperties.duration).toBeGreaterThan(0);
    });

    it('should monitor failed XMLHttpRequest', async () => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('GET', 'https://api.example.com/error');
      xhr.send();
      
      // Simulate error response
      Object.defineProperty(xhr, 'status', { value: 500, writable: true });
      Object.defineProperty(xhr, 'statusText', { value: 'Internal Server Error', writable: true });
      Object.defineProperty(xhr, 'responseText', { value: 'Server error', writable: true });
      Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
      
      const event = new Event('readystatechange');
      xhr.dispatchEvent(event);
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();
      
      const trackingCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(trackingCall[1].body);
      const trackedEvent = requestBody.events[0];
      const customProperties = JSON.parse(trackedEvent.custom_properties);
      
      expect(customProperties.success).toBe(false);
      expect(customProperties.statusCode).toBe(500);
      expect(customProperties.errorMessage).toBe('Internal Server Error');
    });
  });

  describe('API Monitoring Configuration', () => {
    it('should not monitor APIs when autoTrackApi is disabled', () => {
      tracker.destroy();
      
      // Reset to original implementations
      global.fetch = originalFetch;
      global.XMLHttpRequest = originalXHR;
      
      tracker = new ArgosTracker({
        ...mockConfig,
        autoTrackApi: false
      });

      // XMLHttpRequest and fetch should not be modified
      expect(global.XMLHttpRequest).toBe(originalXHR);
      expect(global.fetch).toBe(originalFetch);
    });

    it('should restore original methods on destroy', () => {
      // First destroy current tracker
      tracker.destroy();
      
      // Reset to original implementations
      global.fetch = originalFetch;
      global.XMLHttpRequest = originalXHR;
      
      // Create new tracker with API monitoring
      tracker = new ArgosTracker({
        ...mockConfig,
        autoTrackApi: true
      });
      
      // Verify methods are modified
      expect(global.XMLHttpRequest).not.toBe(originalXHR);
      expect(global.fetch).not.toBe(originalFetch);

      // Destroy tracker and verify restoration
      tracker.destroy();
      expect(global.XMLHttpRequest).toBe(originalXHR);
      expect(global.fetch).toBe(originalFetch);
    });

    it('should filter out tracker own requests', async () => {
      // Make a request to the same URL as reportUrl
      await fetch('https://api.example.com/track', { method: 'POST' });
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only have the original request, no tracking call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual API Tracking', () => {
    it('should allow manual API performance tracking', async () => {
      tracker.trackApiPerformance({
        url: 'https://api.example.com/manual',
        method: 'PUT',
        duration: 250,
        statusCode: 200,
        success: true,
        requestSize: 1024,
        responseSize: 2048
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalled();
      
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const event = requestBody.events[0];
      const customProperties = JSON.parse(event.custom_properties);
      
      expect(customProperties.url).toBe('https://api.example.com/manual');
      expect(customProperties.method).toBe('PUT');
      expect(customProperties.duration).toBe(250);
      expect(customProperties.success).toBe(true);
      expect(customProperties.requestSize).toBe(1024);
      expect(customProperties.responseSize).toBe(2048);
    });
  });
});