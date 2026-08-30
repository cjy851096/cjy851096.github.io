# 陈建扬的个人技术博客

基于 Hexo + Fluid 的求职型技术博客。

## 开始使用

```bash
npm install
npm run dev
```

访问 http://localhost:4000。

线上地址：https://cjy851096.github.io/

## 发布

站点部署配置位于根目录 `_config.yml`。发布前执行：

```bash
npm run clean
npm run build
npm run deploy
```

## 写文章

```bash
npm run new -- "文章标题"
```

文章放在 `source/_posts/`，使用 Markdown 编写。
