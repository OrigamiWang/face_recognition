const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');

const app = express();
const upload = multer({ dest: 'uploads/' });

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
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const facesDir = path.join(__dirname, 'faces');
        
        console.log(`Faces directory: ${facesDir}`);
        
        // 确保 faces 目录存在
        if (!fs.existsSync(facesDir)) {
            console.log('Creating faces directory');
            fs.mkdirSync(facesDir, { recursive: true });
        }

        const oldPath = req.file.path;
        const newFileName = `${req.body.name}${path.extname(req.file.originalname)}`;
        const newPath = path.join(facesDir, newFileName);

        console.log(`Old path: ${oldPath}`);
        console.log(`New path: ${newPath}`);

        // 使用同步操作移动文件
        fs.renameSync(oldPath, newPath);

        console.log(`File successfully moved to: ${newPath}`);
        res.json({ message: 'Face added successfully' });
    } catch (error) {
        console.error('Error adding face:', error);
        res.status(500).json({ error: 'Error adding face', details: error.message, stack: error.stack });
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

const PORT = 8668;
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
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

module.exports = { server, shutdownServer };