# MapleLab

MapleLab 是一个面向《冒险岛手游》的前端工具站，包含等级经验跟踪、装备升级材料计算和完美核心模拟等功能。

## 技术栈

- React 19
- TypeScript
- Vite 7
- Vitest
- sql.js

## 本地开发

```bash
npm install
npm run dev
```

访问 Vite 输出的本地地址即可使用。

## 常用命令

```bash
npm test             # 运行单元测试
npm run build        # 生产构建
npm run build:pages  # GitHub Pages 构建
npm run preview      # 预览生产构建
```

## 项目结构

```text
.
├─ .github/workflows/  # GitHub Pages 部署
├─ public/             # 静态图片、SQLite 数据与 WASM 资源
├─ scripts/            # 数据同步脚本
├─ src/                # React 页面、样式、计算与测试
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

站点由 GitHub Actions 自动测试、构建并部署到 GitHub Pages。
