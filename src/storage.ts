import { STORAGE_KEYS } from './constants';
import { generateUUID, safeParse, safeStringify } from './utils';
import { TrackEvent } from './types';

/**
 * 存储管理器
 */
export class StorageManager {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userId = this.getUserId();
  }

  /**
   * 获取或创建会话ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = this.getItem(STORAGE_KEYS.SESSION_ID);
    
    if (!sessionId) {
      sessionId = generateUUID();
      this.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    
    return sessionId;
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  /**
   * 获取用户ID
   */
  getUserId(): string | undefined {
    if (this.userId) {
      return this.userId;
    }
    
    const storedUserId = this.getItem(STORAGE_KEYS.USER_ID);
    if (storedUserId) {
      this.userId = storedUserId;
      return storedUserId;
    }
    
    return undefined;
  }

  /**
   * 清除用户ID
   */
  clearUserId(): void {
    this.userId = undefined;
    this.removeItem(STORAGE_KEYS.USER_ID);
  }

  /**
   * 保存待上报事件
   */
  savePendingEvents(events: TrackEvent[]): void {
    const existingEvents = this.getPendingEvents();
    const allEvents = [...existingEvents, ...events];
    this.setItem(STORAGE_KEYS.PENDING_EVENTS, safeStringify(allEvents));
  }

  /**
   * 获取待上报事件
   */
  getPendingEvents(): TrackEvent[] {
    const eventsStr = this.getItem(STORAGE_KEYS.PENDING_EVENTS);
    return eventsStr ? safeParse(eventsStr, []) : [];
  }

  /**
   * 清除待上报事件
   */
  clearPendingEvents(): void {
    this.removeItem(STORAGE_KEYS.PENDING_EVENTS);
  }

  /**
   * 移除指定数量的待上报事件
   */
  removePendingEvents(count: number): void {
    const events = this.getPendingEvents();
    const remainingEvents = events.slice(count);
    
    if (remainingEvents.length > 0) {
      this.setItem(STORAGE_KEYS.PENDING_EVENTS, safeStringify(remainingEvents));
    } else {
      this.clearPendingEvents();
    }
  }

  /**
   * 重新生成会话ID
   */
  renewSessionId(): string {
    this.sessionId = generateUUID();
    this.setItem(STORAGE_KEYS.SESSION_ID, this.sessionId);
    return this.sessionId;
  }

  /**
   * 清除所有存储数据
   */
  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
    this.sessionId = generateUUID();
    this.userId = undefined;
  }

  /**
   * 设置存储项
   */
  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('Failed to set localStorage item:', error);
    }
  }

  /**
   * 获取存储项
   */
  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn('Failed to get localStorage item:', error);
    }
    return null;
  }

  /**
   * 移除存储项
   */
  private removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to remove localStorage item:', error);
    }
  }
}