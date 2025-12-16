async function run() {
  const model = await cocoSsd.load();
  const video = document.getElementById('webcam');
  await setupCamera(video);

  // Подгоняем canvas под реальные размеры видео
  const canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  console.log('Модель загружена, камера запущена');

  async function detectFrame() {
    const predictions = await model.detect(video);
    drawPredictions(predictions, ctx, video);
    requestAnimationFrame(detectFrame);
  }

  detectFrame();
}

async function setupCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });
}

function drawPredictions(predictions, ctx, video) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const scaleX = ctx.canvas.width / video.videoWidth;
  const scaleY = ctx.canvas.height / video.videoHeight;

  predictions.forEach(pred => {
    let [x, y, width, height] = pred.bbox;

    // Масштабируем bbox под canvas
    x *= scaleX;
    y *= scaleY;
    width *= scaleX;
    height *= scaleY;

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText(pred.class + ' (' + (pred.score * 100).toFixed(1) + '%)', x, y > 10 ? y - 5 : 10);
  });
}

run();
