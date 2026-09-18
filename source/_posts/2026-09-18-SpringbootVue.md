---
title: SpringBoot + Vue 项目部署到服务器
date: 2026-09-18
tags: [SpringBoot, Vue, 部署, Nginx, Linux]
categories: 部署
---


# SpringBoot + Vue 部署到服务器

> 本文记录将 SpringBoot + Vue 前后端分离项目部署到 Ubuntu 服务器的完整流程，涵盖环境准备、打包、Nginx 前端代理与 Systemd 后台服务部署。

## 目录
- [一、准备工作](#一准备工作)
- [二、项目打包](#二项目打包)
- [三、部署](#三部署)

---

## 一、准备工作

需要以下环境：

- Ubuntu 服务器
- MySQL
- Nginx
- JDK 22

### 1. MySQL

#### 安装命令

```bash
# 可先进行更新
sudo apt update

# 安装
sudo apt install mysql-server

# 启动服务
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql

# 检查服务状态
sudo systemctl status mysql

# 运行安全配置脚本
sudo mysql_secure_installation

# 更改密码
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
FLUSH PRIVILEGES;
```

#### 可选：使用 Docker 拉取镜像

```bash
docker pull mysql:latest
```

#### 注意事项：root 认证方式

若通过 Navicat 等工具远程连接报错，通常是因为 root 用户使用了 `auth_socket` 认证插件——该插件只允许系统用户通过 socket 连接，不允许密码认证。

```sql
-- 检查 root 用户的认证插件
SELECT user, host, plugin, authentication_string FROM mysql.user WHERE user = 'root';

-- 修改 root 用户的认证方式为 mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
FLUSH PRIVILEGES;
```

> ⚠️ 如果显示的 `plugin` 是 `auth_socket` 或其他插件，需要改为 `mysql_native_password`。

### 2. Nginx

#### 安装命令

```bash
# 安装
sudo apt install nginx -y

# 启动服务
sudo systemctl start nginx

# 开机自启
sudo systemctl enable nginx

# 验证安装
sudo systemctl status nginx
```

### 3. JDK 22

#### 安装命令

```bash
# 添加 OpenJDK PPA（可以到 JDK 22）
sudo add-apt-repository ppa:openjdk-r/ppa

sudo apt update

# 安装 OpenJDK 22
sudo apt install openjdk-22-jdk
```

### 4. 开放端口

| 端口 | 用途 |
|------|------|
| 3306 | MySQL |
| 8080 | SpringBoot 后端 |
| 5173 | Vue 前端（Vite 构建） |
| 22 | 远程连接 |
| 80 / 443 | HTTP / HTTPS（服务器一般自带） |

---

## 二、打包

需要修改项目相关配置（如 API 地址、数据库连接等），然后分别打包。

### 前端（dist 文件夹）

```bash
npm run build
```

### 后端（jar 包）

```bash
mvn clean package
```

### 上传到服务器

将打包产物上传到指定位置，示例目录：`/var/www/homework/`

```text
/var/www/homework/
├── frontend/          # 前端 dist 产物
└── backend/           # 后端 jar 包
```

---

## 三、部署

### 前端

#### (1) 创建站点配置文件

```bash
sudo nano /etc/nginx/sites-available/your-project
```

#### (2) 配置 Nginx 代理 Vue 前端

```nginx
server {
    listen 80;
    server_name ; # IP 或 域名

    # Vue 前端配置
    root /var/www/homework/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 正确的代理配置
    location /api/ {
        proxy_pass http://localhost:8080/api/;  # 注意这里要加上 /api/
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 开启 Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

> Nginx 的主要配置文件位于 `/etc/nginx/nginx.conf`，但通常我们不直接修改它，而是在 `/etc/nginx/sites-available/` 下创建新的配置文件。

#### (3) 启用站点配置

```bash
sudo ln -s /etc/nginx/sites-available/your-project /etc/nginx/sites-enabled/
```

#### (4) 测试 Nginx 配置

```bash
sudo nginx -t
```

如果显示 `syntax is ok` 和 `test is successful`，说明配置正确。

#### (5) 重启 Nginx

```bash
sudo systemctl restart nginx
```

### 后端

创建 Systemd 服务（推荐方式）

#### (1) 创建服务文件

```bash
sudo nano /etc/systemd/system/springboot-homework.service
```

#### 配置文件

```ini
[Unit]
Description=Spring Boot Homework Backend
After=syslog.target network.target

[Service]
User=root
WorkingDirectory=/var/www/homework/backend/
ExecStart=/usr/bin/java -jar /var/www/homework/backend/backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143

# 生产环境建议添加 JVM 参数（示例）
# Environment="JAVA_OPTS=-Xms512m -Xmx1024m -Dspring.profiles.active=prod"
# ExecStart=/usr/bin/java $JAVA_OPTS -jar your-app.jar

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

> 除 Systemd 方式外，也可以使用其他方式启动后端（如 nohup、nssm 等）。

#### (2) 启用并启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable springboot-homework
sudo systemctl start springboot-homework
```

#### (3) 检查服务状态

```bash
sudo systemctl status springboot-homework
```

正常输出应显示 `active (running)`。

#### (4) 测试接口（示例）

```bash
# 测试注册 API
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser789","password":"123456","confirmPassword":"123456","email":"test789@example.com"}'
```

---

## 完成

就这样，SpringBoot + Vue 项目部署完成。

---

> **版权声明**：本文为 CSDN 博主「2406_86660213」的原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接及本声明。
>
> 原文链接：https://blog.csdn.net/2406_86660213/article/details/152285612

---

**整理完成。** 内容已重构为规范 Markdown：

- ✅ 添加 YAML front matter（title / date / tags）适配 blog 结构
- ✅ 表格化「开放端口」清单
- ✅ 所有命令放进带语言标记的代码块（bash / sql / nginx / ini）
- ✅ 修正原文笔误 `listen 80;` 后多余空格、删除散落的「AI写代码」行号注释
- ✅ 保留原 CSDN 版权声明与出处链接
- ✅ 规范了标题层级与目录锚点