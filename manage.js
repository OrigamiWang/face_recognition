// 加载人脸列表
async function loadFaces() {
    try {
        const response = await fetch('/api/faces');
        const faces = await response.json();
        const container = document.getElementById('faces-container');
        container.innerHTML = '';
        faces.forEach(face => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${face.url}" alt="${face.name}" width="50" class="rounded"></td>
                <td>${face.name}</td>
                <td><button onclick="deleteFace('${face.name}')" class="btn btn-danger btn-sm">删除</button></td>
            `;
            container.appendChild(tr);
        });
    } catch (error) {
        console.error('加载人脸列表失败:', error);
        alert('加载人脸列表失败，请检查网络连接或联系管理员。');
    }
}

// 加载背景图片
async function loadBackground() {
    try {
        const response = await fetch('/api/background');
        const background = await response.json();
        const container = document.getElementById('background-container');
        container.innerHTML = `
            <img src="${background.url}?t=${new Date().getTime()}" alt="背景图片" class="img-fluid rounded">
            <p class="mt-2">当前背景图片</p>
        `;
    } catch (error) {
        console.error('加载背景图片失败:', error);
        alert('加载背景图片失败，请检查网络连接或联系管理员。');
    }
}

// 添加人脸
document.getElementById('add-face-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('face-file');
    const nameInput = document.getElementById('face-name');
    
    if (!fileInput.files[0]) {
        alert('请选择一个文件');
        return;
    }
    
    formData.append('file', fileInput.files[0]);
    formData.append('name', nameInput.value);
    
    try {
        const response = await fetch('/api/faces', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '服务器响应错误');
        }
        
        const result = await response.json();
        alert('人脸添加成功！');
        
        // 直接更新界面，而不是重新加载
        const container = document.getElementById('faces-container');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${result.url}" alt="${result.name}" width="50" class="rounded"></td>
            <td>${result.name}</td>
            <td><button onclick="deleteFace('${result.name}')" class="btn btn-danger btn-sm">删除</button></td>
        `;
        container.appendChild(tr);
        
        // 清空表单
        fileInput.value = '';
        nameInput.value = '';
    } catch (error) {
        console.error('添加人脸失败:', error);
        alert(`添加人脸失败: ${error.message}。请重试或联系管理员。`);
    }
});

// 更新背景图片
document.getElementById('update-background-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', document.getElementById('background-file').files[0]);
    try {
        const response = await fetch('/api/background', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        alert('背景图片更新成功！');
        loadBackground();
    } catch (error) {
        console.error('更新背景图片失败:', error);
        alert('更新背景图片失败，请重试或联系管理员。');
    }
});

// 删除人脸
async function deleteFace(name) {
    try {
        const response = await fetch(`/api/faces/${name}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('服务器响应错误');
        }
        alert('人脸删除成功！');
        loadFaces();
    } catch (error) {
        console.error('删除人脸失败:', error);
        alert('删除人脸失败，请重试或联系管理员。');
    }
}

// 初始加载
loadFaces();
loadBackground();