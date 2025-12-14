let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

// Пороги Canny
const lowThreshold = 20;
const highThreshold = 100;

function startCamera() {
    // Универсальный вариант: сначала задняя камера, если не получилось — любая
    let constraints = { video: { facingMode: { ideal: "environment" } }, audio: false };

    navigator.mediaDevices.getUserMedia(constraints)
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true, audio: false }))
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                processVideo();
            };
        })
        .catch(err => console.error('Ошибка доступа к камере:', err));
}

function processVideo() {
    let src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let cap = new cv.VideoCapture(video);

    function detect() {
        cap.read(src);

        if (src.empty()) {
            requestAnimationFrame(detect);
            return;
        }

        // 1. Серое изображение
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        // 2. Размытие
        cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
        // 3. Canny edge detection
        cv.Canny(blur, edges, lowThreshold, highThreshold);
        // 4. Находим контуры
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // 5. Рисуем видео + bounding boxes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        for (let i = 0; i < contours.size(); i++) {
            let rect = cv.boundingRect(contours.get(i));
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }

        requestAnimationFrame(detect);
    }

    detect();
}

// Используем cv.onRuntimeInitialized вместо onOpenCvReady
cv['onRuntimeInitialized'] = () => {
    console.log('OpenCV.js готов');
    startCamera();
};
