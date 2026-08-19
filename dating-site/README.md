# Dating Site — GitHub Pages + Supabase

一个可部署到 GitHub Pages 的相亲资料网站第一版。

## 功能
- 首页女士图片卡片列表
- 点击进入女士详情页
- WhatsApp 一键联系
- Supabase Database 保存女士资料
- Supabase Storage 保存女士照片
- Supabase Auth 管理员登录
- 后台新增、编辑、删除、上下架
- 支持多张照片
- 手机端响应式

## 部署顺序
1. 创建 Supabase 项目。
2. 打开 `sql/schema.sql`，在 Supabase SQL Editor 执行全部 SQL。
3. 在 Supabase Authentication > Users 中创建管理员账号。
4. 在 `js/config.js` 填入 Supabase Project URL 和 anon/publishable key。
5. 把整个目录上传到 GitHub 仓库。
6. GitHub Settings > Pages > Deploy from branch > main / root。
7. 打开 `/admin/` 登录后台。

## 重要
不要把 Supabase service_role/secret key 放进前端。这里只使用浏览器可公开使用的 anon/publishable key，并通过 RLS 控制权限。

## WhatsApp
号码填写国际格式数字，不要填写 `+`、空格或括号。例如中国大陆号码填写 `8613800138000`，墨西哥号码填写 `521XXXXXXXXXX`（具体格式按 WhatsApp 实际号码为准）。
