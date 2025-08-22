import { TrackerConfig, TrackEvent, UserInfo } from './types';
import { EventType, ReportMethod, DEFAULT_CONFIG } from './constants';
import { StorageManager } from './storage';
import { Reporter } from './reporter';
import { AutoCollector } from './collector';
import {
  deepMerge,
  getCurrentTimestamp,
  getPageInfo,
  getUserAgent,
  getScreenResolution,
  getDeviceType
} from './utils';

/**
 * Argos 埋点追踪器
 */
export class ArgosTracker {
  private config: TrackerConfig;
  private storage: StorageManager;
  private reporter: Reporter;
  private collector: AutoCollector;
  private eventQueue: TrackEvent[] = [];
  private batchTimer: number | null = null;
  private isInitialized = false;

  constructor(config: TrackerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = new StorageManager();
    this.reporter = new Reporter(this.config);
    this.collector = new AutoCollector(this.handleAutoEvent.bind(this));
    
    this.init();
  }

  /**
   * 初始化追踪器
   */
  private init(): void {
    if (this.isInitialized) {
      return;
    }

    // 设置用户ID
    if (this.config.userId) {
      this.storage.setUserId(this.config.userId);
    }

    // 启动自动收集
    this.collector.start({
      autoTrackPageView: this.config.autoTrackPageView,
      autoTrackClick: this.config.autoTrackClick,
      autoTrackError: this.config.autoTrackError
    });

    // 处理页面卸载时的数据上报
    this.setupBeforeUnload();

    // 恢复待上报事件
    this.restorePendingEvents();

    this.isInitialized = true;
    this.log('Tracker initialized');
  }

  /**
   * 追踪自定义事件
   */
  track(eventName: string, properties?: Record<string, any>): void {
    this.trackEvent({
      eventType: EventType.CUSTOM,
      eventName,
      properties
    });
  }

  /**
   * 追踪页面访问
   */
  trackPageView(properties?: Record<string, any>): void {
    const pageInfo = getPageInfo();
    
    this.trackEvent({
      eventType: EventType.PAGE_VIEW,
      eventName: 'page_view',
      properties: {
        ...pageInfo,
        ...properties
      }
    });
  }

  /**
   * 追踪用户行为
   */
  trackUserAction(actionName: string, properties?: Record<string, any>): void {
    this.trackEvent({
      eventType: EventType.USER_ACTION,
      eventName: actionName,
      properties
    });
  }

  /**
   * 设置用户信息
   */
  setUser(userInfo: UserInfo): void {
    this.storage.setUserId(userInfo.userId);
    
    // 追踪用户设置事件
    this.trackEvent({
      eventType: EventType.CUSTOM,
      eventName: 'user_set',
      properties: userInfo.properties
    });
  }

  /**
   * 清除用户信息
   */
  clearUser(): void {
    this.storage.clearUserId();
    
    this.trackEvent({
      eventType: EventType.CUSTOM,
      eventName: 'user_clear'
    });
  }

  /**
   * 立即上报所有待上报事件
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this.sendEvents();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<TrackerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.reporter.updateConfig(this.config);
    
    if (newConfig.userId) {
      this.storage.setUserId(newConfig.userId);
    }
  }

  /**
   * 销毁追踪器
   */
  destroy(): void {
    this.collector.stop();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // 上报剩余事件
    this.flush();
    
    this.isInitialized = false;
    this.log('Tracker destroyed');
  }

  /**
   * 追踪事件（内部方法）
   */
  private trackEvent(event: Partial<TrackEvent>): void {
    if (!this.isInitialized) {
      this.log('Tracker not initialized, event ignored');
      return;
    }

    const fullEvent: TrackEvent = {
      ...event,
      timestamp: event.timestamp || getCurrentTimestamp(),
      userId: event.userId || this.storage.getUserId(),
      sessionId: event.sessionId || this.storage.getSessionId(),
      pageUrl: event.pageUrl || window.location.href,
      pageTitle: event.pageTitle || document.title,
      userAgent: event.userAgent || getUserAgent(),
      screenResolution: event.screenResolution || getScreenResolution(),
      deviceType: event.deviceType || getDeviceType()
    } as TrackEvent;

    this.addToQueue(fullEvent);
  }

  /**
   * 处理自动收集的事件
   */
  private handleAutoEvent(event: TrackEvent): void {
    this.trackEvent(event);
  }

  /**
   * 添加事件到队列
   */
  private addToQueue(event: TrackEvent): void {
    this.eventQueue.push(event);
    this.log('Event added to queue:', event.eventName);

    if (this.config.reportMethod === ReportMethod.IMMEDIATE) {
      this.sendEvents();
    } else if (this.config.reportMethod === ReportMethod.BATCH) {
      if (this.eventQueue.length >= (this.config.batchSize || 10)) {
        this.sendEvents();
      } else {
        this.scheduleBatchSend();
      }
    }
  }

  /**
   * 调度批量发送
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = window.setTimeout(() => {
      this.sendEvents();
      this.batchTimer = null;
    }, this.config.batchInterval || 5000);
  }

  /**
   * 发送事件
   */
  private async sendEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const success = await this.reporter.report(eventsToSend);
      
      if (!success) {
        // 上报失败，保存到本地存储
        this.storage.savePendingEvents(eventsToSend);
        this.log('Events saved to storage due to report failure');
      }
    } catch (error) {
      // 上报异常，保存到本地存储
      this.storage.savePendingEvents(eventsToSend);
      this.log('Events saved to storage due to error:', error);
    }
  }

  /**
   * 恢复待上报事件
   */
  private restorePendingEvents(): void {
    const pendingEvents = this.storage.getPendingEvents();
    
    if (pendingEvents.length > 0) {
      this.log('Restoring pending events:', pendingEvents.length);
      this.eventQueue.push(...pendingEvents);
      this.storage.clearPendingEvents();
      
      // 延迟发送，避免初始化时立即发送
      setTimeout(() => {
        this.sendEvents();
      }, 1000);
    }
  }

  /**
   * 设置页面卸载时的处理
   */
  private setupBeforeUnload(): void {
    const handleBeforeUnload = () => {
      if (this.eventQueue.length > 0) {
        // 使用 sendBeacon 发送剩余事件
        const tempReporter = new Reporter({
          ...this.config,
          reportMethod: ReportMethod.BEACON
        });
        
        tempReporter.report([...this.eventQueue]);
        
        // 保存到本地存储作为备份
        this.storage.savePendingEvents(this.eventQueue);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
  }

  /**
   * 输出日志
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[ArgosTracker] ${message}`, ...args);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): TrackerConfig {
    return { ...this.config };
  }

  /**
   * 获取当前用户ID
   */
  getUserId(): string | undefined {
    return this.storage.getUserId();
  }

  /**
   * 获取当前会话ID
   */
  getSessionId(): string {
    return this.storage.getSessionId();
  }

  /**
   * 重新生成会话ID
   */
  renewSession(): string {
    return this.storage.renewSessionId();
  }
}