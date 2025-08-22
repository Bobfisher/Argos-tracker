import { EventType, ReportMethod } from './constants';

/**
 * 埋点配置接口
 */
export interface TrackerConfig {
  /** 上报地址 */
  reportUrl: string;
  /** 应用ID */
  appId: string;
  /** 用户ID */
  userId?: string;
  /** 上报方式 */
  reportMethod?: ReportMethod;
  /** 批量上报的最大条数 */
  batchSize?: number;
  /** 批量上报的时间间隔(ms) */
  batchInterval?: number;
  /** 是否开启调试模式 */
  debug?: boolean;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 请求超时时间(ms) */
  timeout?: number;
  /** 是否自动收集页面访问事件 */
  autoTrackPageView?: boolean;
  /** 是否自动收集点击事件 */
  autoTrackClick?: boolean;
  /** 是否自动收集错误事件 */
  autoTrackError?: boolean;
}

/**
 * 埋点事件接口
 */
export interface TrackEvent {
  /** 事件类型 */
  eventType: EventType;
  /** 事件名称 */
  eventName: string;
  /** 事件属性 */
  properties?: Record<string, any>;
  /** 事件时间戳 */
  timestamp?: number;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 页面URL */
  pageUrl?: string;
  /** 页面标题 */
  pageTitle?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 屏幕分辨率 */
  screenResolution?: string;
  /** 设备类型 */
  deviceType?: string;
  /** 持续时间(ms) */
  duration?: number;
  /** 点击目标 */
  click_for?: string;
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  /** 用户ID */
  userId: string;
  /** 用户属性 */
  properties?: Record<string, any>;
}

/**
 * 页面访问事件属性
 */
export interface PageViewProperties {
  /** 页面URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** 来源页面 */
  referrer?: string;
  /** 停留时间(ms) */
  duration?: number;
}

/**
 * 点击事件属性
 */
export interface ClickProperties {
  /** 元素标签名 */
  tagName: string;
  /** 元素ID */
  elementId?: string;
  /** 元素类名 */
  className?: string;
  /** 元素文本内容 */
  textContent?: string;
  /** 点击位置X坐标 */
  clientX: number;
  /** 点击位置Y坐标 */
  clientY: number;
}

/**
 * 错误事件属性
 */
export interface ErrorProperties {
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 错误文件 */
  filename?: string;
  /** 错误行号 */
  lineno?: number;
  /** 错误列号 */
  colno?: number;
  /** 错误类型 */
  errorType: 'javascript' | 'resource' | 'promise';
}