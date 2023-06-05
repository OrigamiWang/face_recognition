# face_recognition

> face recogonition is based on face-api repo, and generate the exe by webview

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