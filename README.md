# zdty2u · Pace 前端

Vue 3 + Vite 跑步工作台。仓库仅发布前端源码、静态资源、构建配置和前端说明。

## 开发

需要 Node.js 20.19+（20.x）或 22.12+，在仓库根目录执行：

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

访问 <http://127.0.0.1:5173>。开发代理将 `/api` 转发到 `http://127.0.0.1:8765`，完整功能需要自行提供兼容的后端服务。

## 构建

```bash
npm --prefix frontend run build
```

静态产物位于 `web/dist`。部署时配置同源 `/api` 代理。

默认目标为 **3.0 公里、6 分钟/公里**，预计 **18 分钟**。距离和配速可自由输入有限正数。

页面提供地点选择、地图预览、运行进度、日志与报告弹窗。前端根据接口返回展示数据和审核状态，不在浏览器本地存储账号或密码。

## 源码和许可

- [前端目录](frontend)
- [前端开发说明](frontend/README.md)
- [MIT 许可](LICENSE)

GitHub Actions 仅检查前端依赖安装和生产构建。
