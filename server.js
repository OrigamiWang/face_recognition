const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

const app = express();

// 配置 multer 以使用自定义存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(app.get('userDataPath'), 'uploads');
        console.log('上传目录:', uploadDir);
        if (!fs.existsSync(uploadDir)) {
            console.log('创建上传目录');
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
            } catch (err) {
                console.error('创建上传目录失败:', err);
                return cb(err, null);
            }
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 提供静态文件
app.use(express.static(__dirname));
app.use('/faces', express.static(path.join(__dirname, 'faces')));
app.use('/background', express.static(path.join(__dirname, 'background')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// 处理根路由，返回 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 获取人脸列表
app.get('/api/faces', (req, res) => {
    const facesDir = path.join(__dirname, 'faces');
    fs.readdir(facesDir, (err, files) => {
        if (err) {
            res.status(500).json({ error: 'Unable to read faces directory' });
        } else {
            const faces = files.map(file => ({
                name: path.parse(file).name,
                url: `/faces/${file}`
            }));
            res.json(faces);
        }
    });
});

// 获取背景图片
app.get('/api/background', (req, res) => {
    const backgroundDir = path.join(__dirname, 'background');
    fs.readdir(backgroundDir, (err, files) => {
        if (err || files.length === 0) {
            res.status(404).json({ error: 'No background image found' });
        } else {
            res.json({ url: `/background/${files[0]}` });
        }
    });
});

// 添加人脸
app.post('/api/faces', upload.single('file'), (req, res) => {
    if (!req.file) {
        console.error('没有上传文件');
        return res.status(400).json({ error: '没有上传文件' });
    }
    try {
        const facesDir = path.join(app.get('userDataPath'), 'faces');
        
        console.log(`人脸目录: ${facesDir}`);
        
        // 确保 faces 目录存在
        if (!fs.existsSync(facesDir)) {
            console.log('创建人脸目录');
            try {
                fs.mkdirSync(facesDir, { recursive: true });
            } catch (err) {
                console.error('创建人脸目录失败:', err);
                return res.status(500).json({ error: '创建人脸目录失败', details: err.message });
            }
        }

        const oldPath = req.file.path;
        const newFileName = `${req.body.name}${path.extname(req.file.originalname)}`;
        const newPath = path.join(facesDir, newFileName);

        console.log(`旧路径: ${oldPath}`);
        console.log(`新路径: ${newPath}`);

        // 使用 fs.copyFile 代替 fs.renameSync
        fs.copyFile(oldPath, newPath, (err) => {
            if (err) {
                console.error('复制文件时出错:', err);
                return res.status(500).json({ error: '添加人脸失败', details: err.message });
            }
            
            // 复制成功后删除原文件
            fs.unlink(oldPath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('删除原文件时出错:', unlinkErr);
                }
                
                console.log(`文件成功移动到: ${newPath}`);
                res.json({ message: '人脸添加成功' });
            });
        });
    } catch (error) {
        console.error('添加人脸时出错:', error);
        res.status(500).json({ error: '添加人脸失败', details: error.message, stack: error.stack });
    }
});

// 更新背景图片
app.post('/api/background', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const image = await Jimp.read(req.file.path);
        const backgroundDir = path.join(__dirname, 'background');
        fs.readdirSync(backgroundDir).forEach(file => {
            fs.unlinkSync(path.join(backgroundDir, file));
        });
        const newPath = path.join(backgroundDir, req.file.originalname);
        await image.writeAsync(newPath);
        fs.unlinkSync(req.file.path);
        res.json({ message: 'Background image updated successfully' });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
});

// 删除人脸
app.delete('/api/faces/:name', (req, res) => {
    const facesDir = path.join(__dirname, 'faces');
    const files = fs.readdirSync(facesDir);
    const faceFile = files.find(file => path.parse(file).name === req.params.name);
    
    if (faceFile) {
        fs.unlinkSync(path.join(facesDir, faceFile));
        res.json({ message: 'Face deleted successfully' });
    } else {
        res.status(404).json({ error: 'Face not found' });
    }
});

// 处理 /manage 请求
app.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, 'manage.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
});

const PORT = 8668;
const server = app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 添加这个函数来确保服务器可以正确关闭
function shutdownServer() {
    return new Promise((resolve, reject) => {
        server.close((err) => {
            if (err) {
                console.error('Error closing server:', err);
                reject(err);
            } else {
                console.log('Server closed successfully');
                resolve();
            }
        });
    });
}

module.exports = function(userDataPath) {
    app.set('userDataPath', userDataPath);
    return { app, server: null };
};