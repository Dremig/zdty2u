# Pace / Vue 跑步工作台

Vue 3 + Vite，图标使用 `@lucide/vue`。浅色卡片布局参考 [Sakai Vue](https://github.com/primefaces/sakai-vue)。

## 运行和构建

需要 Node.js 20.19+（20.x）或 22.12+。在仓库根目录执行：

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

开发页面位于 <http://127.0.0.1:5173>，`/api` 请求代理到 `http://127.0.0.1:8765`。后端服务需自行提供；代理配置位于 `vite.config.js`。

```bash
npm --prefix frontend run build
```

构建产物位于 `web/dist`，可由静态服务托管。部署时为 `/api` 配置同源代理。

## 结构

- `src/App.vue`：页面布局、账号设置、目标摘要、说明和报告弹窗。
- `src/composables/useRunSession.js`：接口调用、预览、启动、取消、恢复和轮询。
- `src/components/RoutePreview.vue` / `MapCanvas.vue`：路线与进度位置预览。
- `src/components/SessionStatus.vue`：进度、运行阶段、审核状态和日志。

默认距离为 3.0 公里，配速为 6 分钟/公里。地点和路线数据由接口提供，运行与审核状态按照接口返回显示。密码在启动请求结束后清空，不写入浏览器本地存储。

项目使用 [MIT 许可](../LICENSE)，依赖分别遵循各自许可。
