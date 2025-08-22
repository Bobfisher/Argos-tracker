# Argos Tracker

一个轻量级的前端埋点数据收集和上报SDK，支持自动埋点和手动埋点，提供完整的用户行为追踪解决方案。

## 特性

- 🚀 **轻量级**: 打包后体积小，对页面性能影响最小
- 📊 **多种埋点方式**: 支持自动埋点和手动埋点
- 🔄 **多种上报策略**: 实时上报、批量上报、页面卸载时上报
- 💾 **离线缓存**: 网络异常时自动缓存，网络恢复后重新上报
- 🛡️ **错误监控**: 自动收集JavaScript错误、Promise异常、资源加载错误
- 🌐 **API性能监控**: 自动监控XMLHttpRequest和Fetch请求的性能数据
- 📱 **设备信息**: 自动收集设备类型、屏幕分辨率、用户代理等信息
- 🔧 **TypeScript支持**: 完整的类型定义，提供更好的开发体验
- 🧪 **完整测试**: 高测试覆盖率，保证代码质量

## 安装

```bash
npm install argos-tracker
```

或者使用 yarn:

```bash
yarn add argos-tracker
```

## 快速开始

### 基础用法

```javascript
import { ArgosTracker } from 'argos-tracker';

// 初始化追踪器
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  userId: 'user-123',
  debug: true // 开发环境建议开启
});

// 追踪自定义事件
tracker.track('button_click', {
  button_id: 'submit-btn',
  page: 'checkout'
});

// 追踪页面访问
tracker.trackPageView({
  campaign: 'summer-sale'
});

// 追踪用户行为
tracker.trackUserAction('form_submit', {
  form_type: 'contact',
  fields: 3
});
```

### 使用CDN

```html
<script src="https://unpkg.com/argos-tracker/dist/index.js"></script>
<script>
  const tracker = new ArgosTracker({
    reportUrl: 'https://your-api.com/track',
    appId: 'your-app-id'
  });
  
  tracker.track('page_load');
</script>
```

## 配置选项

```typescript
interface TrackerConfig {
  /** 上报地址 */
  reportUrl: string;
  /** 应用ID */
  appId: string;
  /** 用户ID */
  userId?: string;
  /** 上报方式 */
  reportMethod?: 'immediate' | 'batch' | 'beacon';
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
  /** 是否自动监控API性能 */
  autoTrackApi?: boolean;
}
```

### 默认配置

```javascript
{
  reportMethod: 'batch',
  batchSize: 10,
  batchInterval: 5000,
  debug: false,
  timeout: 10000,
  autoTrackPageView: true,
  autoTrackClick: false,
  autoTrackError: true,
  autoTrackApi: false,
  headers: {
    'Content-Type': 'application/json'
  }
}
```

## API 文档

### 事件追踪

#### `track(eventName, properties?)`

追踪自定义事件。

```javascript
tracker.track('product_view', {
  product_id: 'abc123',
  category: 'electronics',
  price: 299.99
});
```

#### `trackPageView(properties?)`

追踪页面访问事件。

```javascript
tracker.trackPageView({
  page_type: 'product_detail',
  product_id: 'abc123'
});
```

#### `trackUserAction(actionName, properties?)`

追踪用户行为事件。

```javascript
tracker.trackUserAction('search', {
  query: 'iPhone',
  results_count: 25
});
```

#### `trackApiPerformance(apiData)`

手动追踪API性能数据。

```javascript
tracker.trackApiPerformance({
  url: 'https://api.example.com/users',
  method: 'GET',
  duration: 245,
  statusCode: 200,
  responseSize: 1024,
  requestSize: 256,
  success: true
});
```

### API性能监控

Argos Tracker 支持自动监控API请求性能，包括XMLHttpRequest和Fetch API。

#### 启用自动监控

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  autoTrackApi: true // 启用API自动监控
});
```

#### 监控数据包含

- **请求URL**: 完整的请求地址
- **请求方法**: GET、POST、PUT、DELETE等
- **请求耗时**: 从发起请求到收到响应的时间(毫秒)
- **响应状态码**: HTTP状态码
- **响应大小**: 响应数据的字节大小
- **请求大小**: 请求数据的字节大小
- **成功状态**: 请求是否成功(2xx状态码)
- **错误信息**: 失败请求的错误描述

#### 示例数据格式

```javascript
{
  eventType: 'api_performance',
  eventName: 'api_request',
  properties: {
    url: 'https://api.example.com/users/123',
    method: 'GET',
    duration: 156,
    statusCode: 200,
    responseSize: 2048,
    requestSize: 0,
    success: true
  },
  timestamp: 1640995200000,
  // ... 其他标准字段
}
```

### 用户管理

#### `setUser(userInfo)`

设置用户信息。

```javascript
tracker.setUser({
  userId: 'user-456',
  properties: {
    name: 'John Doe',
    email: 'john@example.com',
    vip_level: 'gold'
  }
});
```

#### `clearUser()`

清除用户信息。

```javascript
tracker.clearUser();
```

### 配置管理

#### `updateConfig(newConfig)`

更新配置。

```javascript
tracker.updateConfig({
  userId: 'new-user-id',
  debug: false
});
```

#### `getConfig()`

获取当前配置。

```javascript
const config = tracker.getConfig();
console.log(config.appId);
```

### 会话管理

#### `getSessionId()`

获取当前会话ID。

```javascript
const sessionId = tracker.getSessionId();
```

#### `renewSession()`

重新生成会话ID。

```javascript
const newSessionId = tracker.renewSession();
```

### 数据上报

#### `flush()`

立即上报所有待上报事件。

```javascript
await tracker.flush();
```

#### `destroy()`

销毁追踪器，清理资源。

```javascript
tracker.destroy();
```

## 自动埋点

### 页面访问追踪

自动追踪页面访问、页面离开、页面隐藏等事件。

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  autoTrackPageView: true // 默认开启
});
```

### 点击事件追踪

自动追踪页面上的点击事件。

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  autoTrackClick: true
});
```

### 错误监控

自动收集JavaScript错误、Promise异常、资源加载错误。

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  autoTrackError: true // 默认开启
});
```

## 上报策略

### 实时上报

事件发生后立即上报。

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  reportMethod: 'immediate'
});
```

### 批量上报

收集一定数量的事件或达到时间间隔后批量上报。

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  reportMethod: 'batch',
  batchSize: 20,
  batchInterval: 10000
});
```

### Beacon上报

使用 `navigator.sendBeacon` API上报，适合页面卸载时使用。

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  reportMethod: 'beacon'
});
```

## 数据格式

### 上报数据结构

```json
{
  "appId": "your-app-id",
  "timestamp": 1640995200000,
  "events": [
    {
      "eventType": "custom",
      "eventName": "button_click",
      "properties": {
        "button_id": "submit-btn",
        "page": "checkout"
      },
      "timestamp": 1640995200000,
      "userId": "user-123",
      "sessionId": "session-456",
      "pageUrl": "https://example.com/checkout",
      "pageTitle": "Checkout Page",
      "userAgent": "Mozilla/5.0...",
      "screenResolution": "1920x1080",
      "deviceType": "desktop"
    }
  ]
}
```

### 事件类型

- `page_view`: 页面访问
- `click`: 点击事件
- `custom`: 自定义事件
- `error`: 错误事件
- `performance`: 性能事件
- `user_action`: 用户行为

## 最佳实践

### 1. 合理设置批量上报参数

```javascript
// 高频应用建议使用较大的批量大小
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  batchSize: 50,
  batchInterval: 30000
});
```

### 2. 生产环境关闭调试模式

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  debug: process.env.NODE_ENV === 'development'
});
```

### 3. 设置合适的请求头

```javascript
const tracker = new ArgosTracker({
  reportUrl: 'https://your-api.com/track',
  appId: 'your-app-id',
  headers: {
    'Authorization': 'Bearer your-token',
    'X-API-Key': 'your-api-key'
  }
});
```

### 4. 页面卸载前确保数据上报

```javascript
window.addEventListener('beforeunload', async () => {
  await tracker.flush();
});
```

## 浏览器兼容性

- Chrome >= 60
- Firefox >= 55
- Safari >= 12
- Edge >= 79
- IE >= 11 (需要 polyfill)

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

详细的更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)