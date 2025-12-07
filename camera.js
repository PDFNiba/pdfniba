import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ----------------------------------
// SUPABASE CLIENT
// ----------------------------------
const supabase = createClient(
  "https://ozpdotxjaprdsxvlrikp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cGRvdHhqYXByZHN4dmxyaWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDkzMTEsImV4cCI6MjA4MDY4NTMxMX0.0J0czcxYk7FnnXjN-43A88BWhMou_C5yzgKMOkjaS_o"
);

// ----------------------------------
// ELEMENTS
// ----------------------------------
const startBtn = document.getElementById("startCam");
const takeBtn = document.getElementById("takePhoto");
const video = document.getElementById("preview");

let stream = null;

// ----------------------------------
// START BACK CAMERA
// ----------------------------------
startBtn.onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });
  } catch (err) {
    // if phone doesn't support exact: environment
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
  }

  video.srcObject = stream;
};

// ----------------------------------
// TAKE PHOTO → UPLOAD → INSERT ROW
// ----------------------------------
takeBtn.onclick = async () => {
  if (!stream) {
    alert("Start the camera first.");
    return;
  }

  try {
    // Draw frame to canvas
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const frame = await imageCapture.grabFrame();

    const canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(frame, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );

    const filePath = `captures/${Date.now()}_photo.jpg`;

    // Upload file
    const { error: uploadErr } = await supabase.storage
      .from("pdfniba")
      .upload(filePath, blob);

    if (uploadErr) throw uploadErr;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("pdfniba")
      .getPublicUrl(filePath);

    const photoURL = urlData.publicUrl;

    // Insert into DB
    const { error: dbErr } = await supabase
      .from("captures")
      .insert({ photo_url: photoURL });

    if (dbErr) throw dbErr;

    alert("Photo saved!");
  } catch (err) {
    console.error("❌ Capture error:", err);
    alert("Capture error: " + err.message);
  }
};
