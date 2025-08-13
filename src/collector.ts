import { EventType } from './constants';
import { ClickProperties, ErrorProperties, PageViewProperties, TrackEvent } from './types';
import { getCurrentTimestamp, getElementSelector, throttle } from './utils';

/**
 * 自动埋点收集器
 */
export class AutoCollector {
  private isCollecting = false;
  private pageStartTime = 0;
  private eventCallback: (event: TrackEvent) => void;
  private unloadListeners: (() => void)[] = [];
  private lastPageViewUrl = '';
  private lastPageViewTime = 0;

  constructor(eventCallback: (event: TrackEvent) => void) {
    this.eventCallback = eventCallback;
  }

  /**
   * 开始收集
   */
  start(options: {
    autoTrackPageView?: boolean;
    autoTrackClick?: boolean;
    autoTrackError?: boolean;
  }): void {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;
    this.pageStartTime = getCurrentTimestamp();

    if (options.autoTrackPageView) {
      this.trackPageView();
      this.setupPageViewTracking();
    }

    if (options.autoTrackClick) {
      this.setupClickTracking();
    }

    if (options.autoTrackError) {
      this.setupErrorTracking();
    }
  }

  /**
   * 停止收集
   */
  stop(): void {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;
    this.cleanup();
  }

  /**
   * 清理事件监听器
   */
  private cleanup(): void {
    this.unloadListeners.forEach(unload => unload());
    this.unloadListeners = [];
  }

  /**
   * 跟踪页面访问
   */
  private trackPageView(): void {
    const currentUrl = window.location.href;
    const currentTime = getCurrentTimestamp();
    
    // 防止重复发送：如果是同一个URL且时间间隔小于100ms，则跳过
    if (this.lastPageViewUrl === currentUrl && 
        currentTime - this.lastPageViewTime < 100) {
      return;
    }
    
    this.lastPageViewUrl = currentUrl;
    this.lastPageViewTime = currentTime;

    const properties: PageViewProperties = {
      url: currentUrl,
      title: document.title,
      referrer: document.referrer || undefined
    };

    this.eventCallback({
      eventType: EventType.PAGE_VIEW,
      eventName: 'page_view',
      properties,
      timestamp: currentTime
    });
  }

  /**
   * 设置页面访问跟踪
   */
  private setupPageViewTracking(): void {


    // 重写 pushState 和 replaceState 方法以捕获程序化路由变化
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const handleHistoryChange = () => {
      // 使用 setTimeout 确保 URL 已经更新
      setTimeout(() => {
        this.trackPageView();
        this.pageStartTime = getCurrentTimestamp();
      }, 0);
    };

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleHistoryChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleHistoryChange();
    };

    // 恢复原始方法的清理函数
    this.unloadListeners.push(() => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });




  }

  /**
   * 设置点击事件跟踪
   */
  private setupClickTracking(): void {
    const handleClick = throttle((event: MouseEvent) => {
      const target = event.target as Element;
      if (!target) return;

      const properties: ClickProperties = {
        tagName: target.tagName.toLowerCase(),
        elementId: target.id || undefined,
        className: target.className || undefined,
        textContent: target.textContent?.trim().substring(0, 100) || undefined,
        clientX: event.clientX,
        clientY: event.clientY
      };

      // 添加元素选择器
      try {
        (properties as any).selector = getElementSelector(target);
      } catch (error) {
        // 忽略选择器生成错误
      }

      this.eventCallback({
        eventType: EventType.CLICK,
        eventName: 'click',
        properties,
        timestamp: getCurrentTimestamp()
      });
    }, 100);

    document.addEventListener('click', handleClick, true);
    this.unloadListeners.push(() => {
      document.removeEventListener('click', handleClick, true);
    });
  }

  /**
   * 设置错误事件跟踪
   */
  private setupErrorTracking(): void {
    // JavaScript 错误
    const handleError = (event: ErrorEvent) => {
      const properties: ErrorProperties = {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorType: 'javascript'
      };

      this.eventCallback({
        eventType: EventType.ERROR,
        eventName: 'javascript_error',
        properties,
        timestamp: getCurrentTimestamp()
      });
    };

    window.addEventListener('error', handleError);
    this.unloadListeners.push(() => {
      window.removeEventListener('error', handleError);
    });

    // Promise 错误
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const properties: ErrorProperties = {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        errorType: 'promise'
      };

      this.eventCallback({
        eventType: EventType.ERROR,
        eventName: 'promise_rejection',
        properties,
        timestamp: getCurrentTimestamp()
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    this.unloadListeners.push(() => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    });

    // 资源加载错误
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const properties: ErrorProperties = {
        message: `Resource load error: ${target.tagName}`,
        filename: (target as any).src || (target as any).href,
        errorType: 'resource'
      };

      this.eventCallback({
        eventType: EventType.ERROR,
        eventName: 'resource_error',
        properties,
        timestamp: getCurrentTimestamp()
      });
    };

    document.addEventListener('error', handleResourceError, true);
    this.unloadListeners.push(() => {
      document.removeEventListener('error', handleResourceError, true);
    });
  }
}