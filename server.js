const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const newPath = path.join(__dirname, 'faces', `${req.body.name}${path.extname(req.file.originalname)}`);
    fs.renameSync(req.file.path, newPath);
    res.json({ message: 'Face added successfully' });
});

// 更新背景图片
app.post('/api/background', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const backgroundDir = path.join(__dirname, 'background');
    fs.readdirSync(backgroundDir).forEach(file => {
        fs.unlinkSync(path.join(backgroundDir, file));
    });
    const newPath = path.join(backgroundDir, req.file.originalname);
    fs.renameSync(req.file.path, newPath);
    res.json({ message: 'Background image updated successfully' });
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

module.exports = server;