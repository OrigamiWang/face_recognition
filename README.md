# 人脸识别系统

## 项目概述
这是一个基于 Node.js 和 Electron 的人脸识别系统，具有实时人脸检测、识别和管理功能。

## 项目结构
```shell
项目结构
face_recognition/
├── README.md
├── background/
├── dist/
├── face-api.min.js
├── faceapi-webview-exe/
├── faces/
├── index.html
├── main.js
├── manage.html
├── manage.js
├── models/
├── node_modules/
├── package-lock.json
├── package.json
├── progress.js
├── public/
├── script.js
├── server.js
├── server.py
├── start.js
├── static/
└── uploads/
```

## 整体架构
- 前端：HTML, CSS, JavaScript
- 后端：Node.js, Express
- 人脸识别：face-api.js
- 桌面应用：Electron
- 图像处理：Jimp

## 主要功能
1. 实时人脸检测和识别
2. 人脸数据管理（添加、删除）
3. 背景图片管理

## 本地部署和测试配置

### 前提条件
- Node.js (v21.0.0 或更高版本)
- npm (随 Node.js 一起安装)

### 安装步骤
1. 克隆仓库：
   ```
   git clone [仓库URL]
   cd face_recognition
   ```

2. 安装依赖：
   ```
   npm install
   ```

### 启动方法

#### 开发模式
运行 Express 服务器：
```
npm start
```


## 日志

1. 将js全部设置为defer，并行加载
    - 经网络分析发现速度有微弱的提升
2. 修复了一个欢迎语显示的bug
3. 模型加载速度影响网页 
   - 解决方法1 
     - 加载模型方式 从 loadFromUri 改成 loadFromDisk
     - brower ---> nodejs
     - nodejs 打包成 exe
     > 由于nodejs是后端，根据后期的安排，选用python作为后端最合适，因此否决这种做法
   - 解决方法2
     - 将ssd模型换成tiny模型
     > 经测试发现速度模型加载速度明显提升
4. 优化了一下进度条的显示
5. 画框改为自定义，移除画框左上角的置信度
6. 修改只能显示一个人名的bug
7. 修改人脸识别阈值，提高识别准确度
8. 将ssd与tiny模型选择设置成一个参数，实现修改一个参数来切换模型
10. 本地化服务，提供本地管理人脸系统方式
11. 提供打包start.js文件
