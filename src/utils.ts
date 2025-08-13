import { DeviceType } from './constants';

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 获取当前时间戳
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * 获取页面信息
 */
export function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer
  };
}

/**
 * 获取用户代理信息
 */
export function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * 获取屏幕分辨率
 */
export function getScreenResolution(): string {
  return `${screen.width}x${screen.height}`;
}

/**
 * 检测设备类型
 */
export function getDeviceType(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return DeviceType.MOBILE;
  }
  
  if (/tablet|ipad/i.test(userAgent)) {
    return DeviceType.TABLET;
  }
  
  return DeviceType.DESKTOP;
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue as any);
      } else {
        result[key] = sourceValue as any;
      }
    }
  }
  
  return result;
}

/**
 * 判断是否为对象
 */
function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 安全的JSON序列化
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Failed to stringify object:', error);
    return '{}';
  }
}

/**
 * 安全的JSON解析
 */
export function safeParse<T = any>(str: string, defaultValue: T): T {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return defaultValue;
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = getCurrentTimestamp();
    
    if (now - lastTime >= wait) {
      lastTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = window.setTimeout(() => {
        lastTime = getCurrentTimestamp();
        timeoutId = null;
        func.apply(this, args);
      }, wait - (now - lastTime));
    }
  };
}

/**
 * 获取元素的CSS选择器路径
 */
export function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(cls => cls.trim());
    if (classes.length > 0) {
      return `.${classes.join('.')}`;
    }
  }
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (!parent) {
    return tagName;
  }
  
  const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
  const index = siblings.indexOf(element);
  
  if (siblings.length > 1) {
    return `${getElementSelector(parent)} > ${tagName}:nth-child(${index + 1})`;
  }
  
  return `${getElementSelector(parent)} > ${tagName}`;
}