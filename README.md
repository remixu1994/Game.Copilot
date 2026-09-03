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
├─ src/
│  ├─ app/             # 应用路由与顶层组合
│  ├─ features/        # 按业务模块组织页面、计算、测试、样式和数据
│  │  ├─ currency/
│  │  ├─ data/
│  │  ├─ dps/
│  │  ├─ equipment-upgrade/
│  │  ├─ home/
│  │  ├─ level-tracker/
│  │  └─ perfect-core/
│  ├─ shared/          # 跨模块复用的无业务工具
│  ├─ styles/          # 应用级全局样式
│  ├─ types/           # 第三方与全局类型声明
│  └─ main.tsx         # Vite/React 启动入口
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

站点由 GitHub Actions 自动测试、构建并部署到 GitHub Pages。

## 代码组织约定

- 新业务功能放在 `src/features/<feature-name>`，页面、计算逻辑、测试和私有样式保持在同一模块内。
- 只有被多个业务模块使用的代码才放入 `src/shared`。
- `src/app` 只负责路由和顶层组合，不承载业务计算。
- 测试文件与被测试实现相邻，命名为 `*.test.ts`。
- 页面组件使用 PascalCase，计算和工具文件使用 camelCase，目录使用 kebab-case。
