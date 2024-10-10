const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

const app = express();
let userDataPath;

// 配置 multer 以使用自定义存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(userDataPath, 'uploads');
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

// 处理根路由，返回 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

function setupRoutes() {
    // 服务静态文件
    app.use(express.static(__dirname));

    app.use('/faces', express.static(path.join(userDataPath, 'faces')));
    app.use('/background', express.static(path.join(userDataPath, 'background')));
    app.use('/models', express.static(path.join(__dirname, 'models')));
    app.use('/static', express.static(path.join(__dirname, 'static')));
    app.use('/public', express.static(path.join(__dirname, 'public')));

    // 处理 /manage 路由
    app.get('/manage', (req, res) => {
        res.sendFile(path.join(__dirname, 'manage.html'));
    });

    // 获取人脸列表
    app.get('/api/faces', (req, res) => {
        const facesDir = path.join(userDataPath, 'faces');
        fs.readdir(facesDir, (err, files) => {
            if (err) {
                console.error('读取人脸目录失败:', err);
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

    // 添加人脸
    app.post('/api/faces', upload.single('file'), (req, res) => {
        if (!req.file) {
            console.error('没有上传文件');
            return res.status(400).json({ error: '没有上传文件' });
        }
        try {
            const facesDir = path.join(userDataPath, 'faces');
            
            console.log(`人脸目录: ${facesDir}`);
            
            if (!fs.existsSync(facesDir)) {
                console.log('创建人脸目录');
                fs.mkdirSync(facesDir, { recursive: true });
            }

            const oldPath = req.file.path;
            const newFileName = `${req.body.name}${path.extname(req.file.originalname)}`;
            const newPath = path.join(facesDir, newFileName);

            console.log(`旧路径: ${oldPath}`);
            console.log(`新路径: ${newPath}`);

            fs.copyFile(oldPath, newPath, (err) => {
                if (err) {
                    console.error('复制文件时出错:', err);
                    return res.status(500).json({ error: '添加人脸失败', details: err.message });
                }
                
                fs.unlink(oldPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('删除原文件时出错:', unlinkErr);
                    }
                    
                    console.log(`文件成功移动到: ${newPath}`);
                    res.json({ message: '人脸添加成功', name: req.body.name, url: `/faces/${newFileName}` });
                });
            });
        } catch (error) {
            console.error('添加人脸时出错:', error);
            res.status(500).json({ error: '添加人脸失败', details: error.message, stack: error.stack });
        }
    });

    // 修改删除人脸的路由
    app.delete('/api/faces/:name', (req, res) => {
        const faceName = req.params.name;
        const facesDir = path.join(userDataPath, 'faces');
        const files = fs.readdirSync(facesDir);
        const fileToDelete = files.find(file => path.parse(file).name === faceName);

        if (!fileToDelete) {
            console.error('找不到要删除的文件:', faceName);
            return res.status(404).json({ error: '找不到要删除的文件' });
        }

        const filePath = path.join(facesDir, fileToDelete);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('删除人脸文件失败:', err);
                return res.status(500).json({ error: '删除人脸失败', details: err.message });
            }
            console.log('成功删除文件:', filePath);
            res.json({ message: '人脸删除成功' });
        });
    });

    // 获取背景图片
    app.get('/api/background', (req, res) => {
        const backgroundDir = path.join(userDataPath, 'background');
        fs.readdir(backgroundDir, (err, files) => {
            if (err || files.length === 0) {
                return res.status(404).json({ error: 'Background image not found' });
            }
            res.json({ url: `/background/${files[0]}` });
        });
    });

    // 修改更新背景图片的路由
    app.post('/api/background', upload.single('file'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const backgroundDir = path.join(userDataPath, 'background');
        if (!fs.existsSync(backgroundDir)) {
            fs.mkdirSync(backgroundDir, { recursive: true });
        }

        // 删除旧的背景图片
        fs.readdirSync(backgroundDir).forEach(file => {
            fs.unlinkSync(path.join(backgroundDir, file));
        });

        const newPath = path.join(backgroundDir, req.file.originalname);

        fs.rename(req.file.path, newPath, (err) => {
            if (err) {
                console.error('更新背景图片失败:', err);
                return res.status(500).json({ error: 'Failed to update background image' });
            }
            console.log('背景图片更新成功:', newPath);
            res.json({ message: 'Background image updated successfully', url: `/background/${req.file.originalname}` });
        });
    });

    // 添加这个新的路由处理器
    app.get('/manage', (req, res) => {
        res.sendFile(path.join(__dirname, 'manage.html'));
    });
}

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
});

module.exports = function(providedUserDataPath) {
    userDataPath = providedUserDataPath;
    setupRoutes(); // 在设置 userDataPath 后设置路由
    return { app };
};