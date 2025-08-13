/**
 * 事件类型枚举
 */
export enum EventType {
  /** 页面访问 */
  PAGE_VIEW = 'page_view',
  /** 页面停留时长 */
  PAGE_DURATION = 'page_duration',
  /** 点击事件 */
  CLICK = 'click',
  /** 自定义事件 */
  CUSTOM = 'custom',
  /** 错误事件 */
  ERROR = 'error',
  /** 性能事件 */
  PERFORMANCE = 'performance',
  /** 用户行为 */
  USER_ACTION = 'user_action'
}

/**
 * 上报方式枚举
 */
export enum ReportMethod {
  /** 实时上报 */
  IMMEDIATE = 'immediate',
  /** 批量上报 */
  BATCH = 'batch',
  /** 页面卸载时上报 */
  BEACON = 'beacon'
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  reportMethod: ReportMethod.BATCH,
  batchSize: 10,
  batchInterval: 5000,
  debug: false,
  timeout: 10000,
  autoTrackPageView: true,
  autoTrackClick: false,
  autoTrackError: true,
  headers: {
    'Content-Type': 'application/json'
  } as Record<string, string>
} as const;

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  SESSION_ID: 'argos_session_id',
  USER_ID: 'argos_user_id',
  PENDING_EVENTS: 'argos_pending_events'
};

/**
 * 设备类型
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet'
}