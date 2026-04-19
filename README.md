# 周报助手 - 网页版

基于 React + Tailwind CSS 构建的周报日报生成器。

## 功能

- 📅 日历视图：按周查看/填写每日工作内容
- 📝 支持日报、周报、月报
- 🎨 标准/简洁两种格式
- 💾 数据自动保存到浏览器本地
- 📋 一键复制/导出

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署到 GitHub Pages

1. 将 `dist` 目录下的所有文件推送到 GitHub 仓库的 `gh-pages` 分支
2. 或者使用 GitHub Actions 自动部署

## 使用说明

1. 首次使用需要输入 Claude API Key（右上角设置）
2. 在日历视图填写每日工作内容
3. 点击"生成今日日报"或"生成本周周报"
4. 生成后可复制或导出报告
