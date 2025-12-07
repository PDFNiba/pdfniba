import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// OPTIONAL — if you want to upload the captured photo
const supabaseUrl = "https://ozpdotxjaprdsxvlrikp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cGRvdHhqYXByZHN4dmxyaWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDkzMTEsImV4cCI6MjA4MDY4NTMxMX0.0J0czcxYk7FnnXjN-43A88BWhMou_C5yzgKMOkjaS_o";
const supabase = createClient(supabaseUrl, supabaseKey);

// Auto-run on page load
window.addEventListener("load", () => startBackCameraCapture());

// Take a snapshot from video stream
async function takeSnapshot(stream) {
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const frame = await imageCapture.grabFrame();

  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(frame, 0, 0);

  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );
}

// MAIN: Ask permission + capture backside photo
async function startBackCameraCapture() {
  try {
    // Request BACK camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });

    // Take photo
    const photoBlob = await takeSnapshot(stream);

    // Stop camera
    stream.getTracks().forEach(t => t.stop());

    console.log("📸 Photo captured:", photoBlob);

    // OPTIONAL — upload to Supabase
    // const url = await uploadImage(photoBlob);
    // console.log("Uploaded URL:", url);

  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera error: " + err.message);
  }
}

// OPTIONAL upload helper
async function uploadImage(blob) {
  const fileName = `captures/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("pdfniba")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: false
    });

  if (error) {
    console.error("Upload failed:", error);
    return null;
  }

  const { data } = supabase.storage
    .from("pdfniba")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
