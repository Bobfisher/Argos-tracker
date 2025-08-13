# 更新日志

## [1.1.7] - 2025-01-12

### 移除
- 移除页面卸载事件（`beforeunload`）的自动监听，不再自动触发 `page_leave` 事件

## [1.1.6] - 2025-01-12

### 修复
- 修复自定义属性上报结构问题，将 `event.properties` 中的属性解构到上报数据的顶层，而不是嵌套在 `properties` 字段中
- 优化上报数据格式，使自定义属性如 `click_for` 等直接作为顶层字段出现

### 改进
- 更新 `formatPayload` 方法，使用 `Object.assign` 将自定义属性合并到 `formattedEvent` 对象

## [1.1.5] - 2025-01-12

### 修复
- 修复页面初始化时可能出现的重复 `page_view` 事件问题
- 添加防重复机制，对同一 URL 在 100ms 内的重复 `page_view` 事件进行去重处理
- 优化事件上报的时间戳一致性

### 改进
- 完善测试环境，添加测试页面用于验证修复效果
- 增强调试功能，支持实时查看上报参数

## [1.1.3] - 2025-01-12

### 修复
- 修复了页面初始化时可能出现的重复 page_view 事件问题，添加了防重复机制
- 对同一URL在100ms内的重复 page_view 事件进行去重处理

### 移除
- 删除了 `collector.ts` 中的 popstate 事件监听逻辑，不再监听浏览器前进后退事件

### 改进
- 代码清理和优化
- 更新版本号

## [1.1.1] - 2025-01-12

### 新增
- 在 `EventType` 枚举中添加 `PAGE_DURATION` 事件类型，用于记录页面停留时长
- 在 `TrackEvent` 接口中添加 `duration` 字段，支持记录事件持续时间
- 在 `TrackEvent` 接口中添加 `click_for` 字段，用于记录点击事件的目标信息

### 移除
- 删除了 `collector.ts` 中注释掉的页面可见性变化监听代码，清理了无用的注释代码

### 改进
- 完善了 URL 变动跟踪功能，现在能够捕获所有类型的路由变化：
  - 页面初始加载跟踪
  - 浏览器前进后退跟踪（popstate 事件）
  - 程序化路由变化跟踪（重写 pushState/replaceState 方法）
- 优化了数据上报格式，调整为新的结构：
  ```json
  {
    "events": [
      {
        "event_name": "page_view",
        "user_id": "695",
        "session_id": "0acc9ccd-57fb-4e8f-b260-03584f0a307e",
        "timestamp": 1754979717847,
        "app_id": "1",
        "platform": "desktop",
        "user_agent": "Mozilla/5.0...",
        "page_url": "http://127.0.0.1:9527/home",
        "duration": 219956
      }
    ]
  }
  ```
- `duration` 字段现在直接从事件对象获取，而不是从 properties 中获取
- 平台类型默认值从 "web" 改为 "desktop"

### 修复
- 修复了页面前进时未记录 URL 变动的问题
- 确保所有 URL 变动都能被正确捕获和上报

### 技术改进
- 重写了 `history.pushState` 和 `history.replaceState` 方法以捕获程序化路由变化
- 在组件卸载时正确恢复原始的 history 方法
- 优化了事件数据格式化逻辑

---

## [1.1.0] - 2025-01-11

### 初始版本
- 实现基础的埋点跟踪功能
- 支持页面访问、点击事件、错误事件的自动收集
- 提供批量上报和实时上报功能
- 支持多种上报方式：fetch、sendBeacon
- 实现会话管理和用户标识
- 提供完整的 TypeScript 类型定义