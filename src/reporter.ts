import { TrackerConfig, TrackEvent } from './types';
import { ReportMethod } from './constants';
import { safeStringify } from './utils';

/**
 * 网络上报器
 */
export class Reporter {
  private config: TrackerConfig;

  constructor(config: TrackerConfig) {
    this.config = config;
  }

  /**
   * 上报事件
   */
  async report(events: TrackEvent[]): Promise<boolean> {
    if (!events.length) {
      return true;
    }

    const { reportMethod } = this.config;

    try {
      switch (reportMethod) {
        case ReportMethod.BEACON:
          return await this.sendBeacon(events);
        case ReportMethod.IMMEDIATE:
        case ReportMethod.BATCH:
        default:
          return await this.sendFetch(events);
      }
    } catch (error) {
      this.handleError('Report failed', error);
      return false;
    }
  }

  /**
   * 使用 fetch 发送数据
   */
  private async sendFetch(events: TrackEvent[]): Promise<boolean> {
    const { reportUrl, headers = {}, timeout = 10000 } = this.config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: this.formatPayload(events),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.log('Events reported successfully', events.length);
        return true;
      } else {
        this.handleError('HTTP error', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        this.handleError('Request timeout', error);
      } else {
        this.handleError('Network error', error);
      }
      
      return false;
    }
  }

  /**
   * 使用 sendBeacon 发送数据
   */
  private async sendBeacon(events: TrackEvent[]): Promise<boolean> {
    if (!navigator.sendBeacon) {
      this.log('sendBeacon not supported, fallback to fetch');
      return this.sendFetch(events).then(result => result).catch(() => false);
    }

    try {
      const success = navigator.sendBeacon(
        this.config.reportUrl,
        this.formatPayload(events)
      );

      if (success) {
        this.log('Events sent via beacon successfully', events.length);
      } else {
        this.handleError('Beacon send failed', null);
      }

      return success;
    } catch (error) {
      this.handleError('Beacon error', error);
      return false;
    }
  }

  /**
   * 格式化上报数据
   */
  private formatPayload(events: TrackEvent[]): string {
    const payload = {
      events: events.map(event => {
        const formattedEvent: any = {
          event_name: event.eventName,
          user_id: event.userId,
          session_id: event.sessionId,
          timestamp: event.timestamp,
          app_id: this.config.appId,
          platform: event.deviceType || 'desktop',
          user_agent: event.userAgent,
          page_url: event.pageUrl
        };

        // 将properties中的属性解构到formattedEvent顶层
        if (event.properties && Object.keys(event.properties).length > 0) {
          Object.assign(formattedEvent, event.properties);
        }

        return formattedEvent;
      })
    };

    return safeStringify(payload);
  }

  /**
   * 处理错误
   */
  private handleError(message: string, error: any): void {
    if (this.config.debug) {
      console.error(`[ArgosTracker] ${message}:`, error);
    }
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
   * 更新配置
   */
  updateConfig(config: Partial<TrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}