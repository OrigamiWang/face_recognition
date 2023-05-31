// 使得face-api.js能够在electron正常工作的解决方法
// 具体参考：https://levelup.gitconnected.com/do-not-laugh-a-simple-ai-powered-game-3e22ad0f8166
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
// 图片路径和名字
// 百度找的图片，证明了url可以使用
// const REFERENCE_IMAGES = ["https://img0.baidu.com/it/u=1738859342,863155099&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=733"];


// minio的文件报错 expected blob type to be of type image/*, instead have: application/octet-stream， 需要blob而提供的是文件流
// const REFERENCE_IMAGES = ["http://43.139.5.93:9090/facerecognition/wyx.jpg"]


const REFERENCE_IMAGES = [];
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
    await fetch('https://faceapi.origami.wang/peopleFace')
        .then(response => response.text())
        .then(res => {
            let arr = res.split(',')
            for (let i = 0; i < arr.length; i++) {
                console.log(arr[i])
                if (i % 2 === 0) {
                    REFERENCE_NAMES.push(arr[i]);
                } else {
                    REFERENCE_IMAGES.push(arr[i]);
                }
            }

        })
}

async function set_background_image() {
    // 将live2d的语言初始化也放在这儿
    window.name = "你好朋友！";

    let body_style = document.body.style
    console.log("加载背景图片...")
    await fetch('https://faceapi.origami.wang/backgroundImage')
        .then(response => response.text())
        .then(res => {
            body_style.backgroundImage = "url('" + res + "')"
        })

}


async function change_welcome(results) {
    if (results.length)//如果识别到人脸且相关程度够高
    {
        let min = 999;
        for (let i = 0; i < results.length; i++) {
            if (results[i].distance < 0.45) {
                for (let j = 0; j < REFERENCE_NAMES.length; j++) {
                    if (i < min && results[i].name === REFERENCE_NAMES[j]) {
                        min = i;
                    }
                }
            }
        }
        if (min < 999) {
            document.getElementById('word').innerHTML = "欢迎" + results[min].name + "莅临指导工作"
            window.name = "欢迎" + results[min].name + "莅临指导工作"
        } else {
            document.getElementById('word').innerHTML = "您好，朋友！";
            window.name = "您好，朋友！"
        }

    } else {
        document.getElementById('word').innerHTML = "您好，朋友！";
        window.name = "您好，朋友！"
    }
}


// 加载模型文件
async function loadModels() {
    // ssd 模型
    // await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    // await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    // await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("加载模型前....")
    // 使用 tiny 模型提速
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("加载模型后....")
}

// 获取参考图片中的人脸描述
async function getReferenceDescriptors() {
    const descriptors = [];
    for (let i = 0; i < REFERENCE_IMAGES.length; i++) {
        const img = await faceapi.fetchImage(REFERENCE_IMAGES[i]);
        // 形参列表添加 new faceapi.TinyFaceDetectorOptions() 表明使用tiny模型
        const useTinyModel = true
        const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(useTinyModel).withFaceDescriptor();
        // const detection = await faceapi.detectSingleFace(img).withFaceLandmarks(false).withFaceDescriptor();
        descriptors.push(detection.descriptor);
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
        const useTinyModel = true;
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(useTinyModel).withFaceDescriptors();
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

        await change_welcome(results)
        // 清空canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.drawImage(video, 0, 0, video.width, video.height)
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        // TODO: 想换一种方法，报错更看不懂
        // resizedDetections.forEach(detection => {
        //     const box = new faceapi.draw.DrawBox(detection.box, {label: ''}) // 空标签表示不显示置信度
        //     box.draw(canvas)
        // })
        // TODO:关闭人脸置信度, 调颜色均失效...
        const options = {
            withScore: false, withClassName: true, withCredentials: false,
            withClassScores: false, textColor: 'white', boxColor: 'white'
        }
        faceapi.draw.drawDetections(canvas, resizedDetections, options)
        // 修改字号
        document.getElementById('word').style.fontSize = "100px"
        // 修改边距
        document.getElementById('word').style.textAlign = "center"


        results.forEach(result => {
            context.strokeStyle = "blue";
            context.lineWidth = 2;
            context.fillStyle = "blue";
            context.font = "40px Arial";
            if (result.distance < 0.45) {
                context.fillText(result.name,
                    (result.box.x + 5) * video.width / 640, (result.box.y) * video.height / 480);
            }
        });
    }, 100);
}

// 调用主函数
script()
