// 使用 HTMLCanvasElement 替代 canvas 模块
faceapi.env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
});

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const MODEL_URL = "./models";
// const welcome = document.getElementById('welcome')
const displaySize = {width: window.innerWidth, height: window.innerHeight}

// 快速替换所选用的模型，true代表使用ssd，false代表使用tiny
const model_select = false
// 图片路径和名字
// 百度找的图片，证明了url可以使用
// const REFERENCE_IMAGES = ["https://img0.baidu.com/it/u=1738859342,863155099&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=733"];


// minio的文件报错 expected blob type to be of type image/*, instead have: application/octet-stream， 需要blob而提供的是文件流
// const REFERENCE_IMAGES = ["http://43.139.5.93:9090/facerecognition/wyx.jpg"]


let REFERENCE_IMAGES = [];
// const REFERENCE_IMAGES = ["face_images/wyx.jpg"];
let REFERENCE_NAMES = [];
let IMG_NAME = [];

// async function get_image_list(img_name) {
//     await fetch('https://minio.origami.wang/facerecognition/' + img_name)
//         .then(response => response.blob())
//         .then(file_blob => {
//             // 注意，图片必须是jpg格式
//             let img_blob = new Blob([file_blob], {type: "image/jpeg"})
//             console.log(img_blob)
//             let img_url = URL.createObjectURL(img_blob)
//             console.log(img_url)
//             REFERENCE_IMAGES.push(img_url)
//         })
// }
//

async function get_face_name_and_url() {
    const response = await fetch('/api/faces');
    const faces = await response.json();
    REFERENCE_NAMES = faces.map(face => face.name);
    REFERENCE_IMAGES = faces.map(face => face.url);
    console.log(REFERENCE_IMAGES)
}

async function set_background_image() {
    window.name = "你好朋友！";
    let body_style = document.body.style;
    console.log("加载背景图片...");
    const response = await fetch('/api/background');
    const background = await response.json();
    body_style.backgroundImage = `url('${background.url}')`;
}

async function change_welcome(results) {
    let res = ""
    if (results.length) {
        results.forEach(result => {
            if (result.distance < 0.35) {
                res += "," + result.name
            }
        })
        res = res.substring(1)
        res = "欢迎" + res + "莅临指导工作"
    } else {
        res = "您好，朋友！"
    }
    document.getElementById('word').innerHTML = res
    window.name = res
}


// 加载模型文件
async function loadModels() {
    console.log("开始加载模型...");
    try {
        if (model_select) {
            console.log("加载 SSD 模型...");
            await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
            console.log("SSD 模型加载完成");
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            console.log("Landmark 模型加载完成");
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            console.log("Recognition 模型加载完成");
        } else {
            console.log("加载 Tiny 模型...");
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log("Tiny 模型加载完成");
            await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
            console.log("Tiny Landmark 模型加载完成");
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            console.log("Recognition 模型加载完成");
        }
        console.log("所有模型加载完成");
    } catch (error) {
        console.error("模型加载失败:", error);
    }
}

// 获取参考图片中的人脸描述
async function getReferenceDescriptors() {
    const descriptors = [];
    for (let i = 0; i < REFERENCE_IMAGES.length; i++) {
        this.progress.value += 5
        try {
            const img = await faceapi.fetchImage(REFERENCE_IMAGES[i]);
            console.log(`Processing image: ${REFERENCE_IMAGES[i]}`);
            let detection = null
            if (model_select) {
                detection = await faceapi.detectSingleFace(img)
                    .withFaceLandmarks().withFaceDescriptor();
            } else {
                const useTinyModel = true
                detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks(useTinyModel).withFaceDescriptor();
            }
            
            if (detection) {
                descriptors.push(detection.descriptor);
            } else {
                console.warn(`No face detected in image: ${REFERENCE_IMAGES[i]}`);
            }
        } catch (error) {
            console.error(`Error processing image ${REFERENCE_IMAGES[i]}:`, error);
        }
    }
    return descriptors;
}

// 启动摄像头
async function startVideo() {
    this.progress.value = 95
    const stream = await navigator.mediaDevices.getUserMedia({video: {aspectRatio: 16 / 9}});
    video.srcObject = stream;
    this.progress.value = 100
}

async function set_width_and_height() {
    video.width = displaySize.width
    video.height = displaySize.height
    canvas.width = displaySize.width
    canvas.height = displaySize.height

}

// 主函数

async function script() {
    // 加载进度条 0%
    await load_progress()

    // 10%
    await set_background_image()
    this.progress.value = 10

    console.log("进入main函数")
    // 设置宽高
    // 15%
    await set_width_and_height();
    this.progress.value = 15

    // 加载模型文件
    // 40%
    await loadModels();
    this.progress.value = 40

    // 加载图片文件
    // 80%
    await get_face_name_and_url();

    console.log("get_face_name_and_url 执行成功...")
    this.progress.value = 60
    // 获取参考图片中的人脸描述


    const referenceDescriptors = await getReferenceDescriptors();
    console.log("getReferenceDescriptors成功...")

    console.log("启动摄像头前...")
    // 启动摄像头
    await startVideo();
    console.log("启动摄像头后...")


    // 每隔100毫秒，对摄像头画面进行人脸识别，并在canvas上显示结果
    setInterval(async () => {
        // 获取摄像头画面中的人脸描述
        // 形参列表添加 new faceapi.TinyFaceDetectorOptions() 表明使用tiny模型
        let detections = null
        if (model_select) {
            detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({withFaceExpressions: false}))
                .withFaceLandmarks().withFaceDescriptors();
        } else {
            const useTinyModel = true;
            detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({withFaceExpressions: false}))
                .withFaceLandmarks(useTinyModel).withFaceDescriptors();
        }

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
                // 加入���数，为了区分人脸和名字
                score: fd.detection.score
            };
        });

        await change_welcome(results)
        // 清空canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.drawImage(video, 0, 0, video.width, video.height)
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        // 修改字号
        document.getElementById('word').style.fontSize = "100px"
        // 修改边距
        document.getElementById('word').style.textAlign = "center"

        // 改成自己画框，可以实现去掉默认画框上的置信度，但是会有一个问题，无法匹配画框与人的名字
        // 我们发现，results中存有名字，而results和detections的score在某种程度上是一一对应的关系
        // 因此我么可以通过判断score是否相等，来区分画框与人的名字
        // 我们发现，results中存有名字，而results和detections的score在某种程度上是一一对应的关系
        // 因此我么可以通过判断score是否相等，来区分画框与人的名字
        resizedDetections.forEach(detection => {
            const box = detection.detection.box;
            context.beginPath();
            context.rect(box.x, box.y, box.width, box.height);
            context.strokeStyle = 'blue';
            context.stroke();
            context.font = "40px Arial";
            context.fillStyle = "blue";
            results.forEach(result => {
                if (result.distance < 0.35 && detection.detection.score === result.score) {
                    context.fillText(result.name,
                        (result.box.x + 5) * video.width / 640, (result.box.y) * video.height / 480);
                }
            });
        });


        // results.forEach(result => {
        //     context.strokeStyle = "red";
        //     context.lineWidth = 2;
        //     context.fillStyle = "blue";
        //     context.font = "40px Arial";
        //     if (result.distance < 0.45) {
        //         context.fillText(result.name,
        //             (result.box.x + 5) * video.width / 640, (result.box.y) * video.height / 480);
        //     }
        // });
    }, 100);
}

// 调用主函数
script()
