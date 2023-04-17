const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const MODEL_URL = "/models";
// 图片路径和名字


// 百度找的图片，证明了url可以使用
// const REFERENCE_IMAGES = ["https://img0.baidu.com/it/u=1738859342,863155099&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=733"];


// minio的文件报错 expected blob type to be of type image/*, instead have: application/octet-stream， 需要blob而提供的是文件流
// const REFERENCE_IMAGES = ["http://43.139.5.93:9090/facerecognition/wyx.jpg"]
const REFERENCE_IMAGES = [];
// const REFERENCE_IMAGES = ["face_images/wyx.jpg"];
let REFERENCE_NAMES = [];
let IMG_NAME = [];

async function get_image_list(img_name) {
    await fetch('http://43.139.5.93:9090/facerecognition/' + img_name)
        .then(response => response.blob())
        .then(file_blob => {
            // 注意，图片必须是jpg格式
            let img_blob = new Blob([file_blob], {type: "image/jpeg"})
            console.log(img_blob)
            let img_url = URL.createObjectURL(img_blob)
            console.log(img_url)
            REFERENCE_IMAGES.push(img_url)
        })
}

async function get_name_list() {
    await fetch('http://localhost:5000/getNameList')
        .then(response => response.text())
        .then(data => data.split(','))
        .then(res => REFERENCE_NAMES = res)
}

async function get_image_name_list() {
    await fetch('http://localhost:5000/getImageList')
        .then(response => response.text())
        .then(data => data.split(','))
        .then(res => IMG_NAME = res)
}


// 将url转成blob
async function save_data() {
    await get_name_list()
    console.log(REFERENCE_NAMES)
    await get_image_name_list()
    console.log(IMG_NAME)
    for (let i = 0; i < IMG_NAME.length; i++) {
        await get_image_list(IMG_NAME[i])
    }
}


// 加载模型文件
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

// 获取参考图片中的人脸描述
async function getReferenceDescriptors() {
    const descriptors = [];
    for (let i = 0; i < REFERENCE_IMAGES.length; i++) {
        const img = await faceapi.fetchImage(REFERENCE_IMAGES[i]);
        console.log(typeof img)
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptors.push(detection.descriptor);
    }
    return descriptors;
}

// 启动摄像头
async function startVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({video: {}});
    video.srcObject = stream;
}

// 主函数
async function main() {
    console.log("进入main函数")
    // 加载模型文件
    await loadModels();
    // 加载图片文件
    await save_data();
    // 获取参考图片中的人脸描述
    const referenceDescriptors = await getReferenceDescriptors();
    // 启动摄像头
    await startVideo();
    // 每隔100毫秒，对摄像头画面进行人脸识别，并在canvas上显示结果
    setInterval(async () => {
        // 获取摄像头画面中的人脸描述
        const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
        // 遍历每个人脸，找到最匹配的参考人脸，并获取其名字和距离
        const results = detections.map(fd => {
            let minDistance = Infinity;
            let minIndex = -1;
            referenceDescriptors.forEach((fr, j) => {
                const distance = faceapi.euclideanDistance(fd.descriptor, fr);
                if (distance < minDistance) {
                    minDistance = distance;
                    minIndex = j;
                }
            });
            return {
                name: REFERENCE_NAMES[minIndex],
                distance: minDistance,
                box: fd.detection.box,
            };
        });
        // 清空canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        // 在canvas上绘制人脸框和名字
        results.forEach(result => {
            context.strokeStyle = "green";
            context.lineWidth = 2;
            context.strokeRect(result.box.x, result.box.y, result.box.width, result.box.height);
            context.fillStyle = "green";
            context.font = "20px Arial";
            context.fillText(result.name + " (" + result.distance.toFixed(2) + ")", result.box.x + 5, result.box.y - 10);
        });
    }, 100);
}

// 调用主函数
main()
