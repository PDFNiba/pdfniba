// Firebase imports (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyA5HSha0laFzd9rQZw5sAHW6O1BcX8BPzI",
  authDomain: "pdfniba.firebaseapp.com",
  projectId: "pdfniba",
  storageBucket: "pdfniba.firebasestorage.app",
  messagingSenderId: "809688909652",
  appId: "1:809688909652:web:9867944191bd95704aaac1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// ---------- DEVICE INFO ----------
function getDeviceInfo() {
  return navigator.userAgent || "Unknown device";
}

// ---------- FIRESTORE METADATA SAVE ----------
async function saveMetadata({ fileURL, cameraType, fileType }) {
  const metadata = {
    fileURL,
    cameraType,   // "front" or "back"
    fileType,     // "photo" or "video"
    timestamp: Date.now(),
    deviceInfo: getDeviceInfo()
  };

  await addDoc(collection(db, "recordings"), metadata);
}

// ---------- CAMERA HELPERS ----------
async function getStream(facingMode) {
  return await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: false
  });
}

function record3Sec(stream) {
  return new Promise((resolve) => {
    const chunks = [];
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));

    recorder.start();
    setTimeout(() => recorder.stop(), 3000);
  });
}

async function upload(blob, name) {
  const fileRef = ref(storage, `captures/${Date.now()}_${name}`);
  await uploadBytes(fileRef, blob);
  const url = await getDownloadURL(fileRef);
  return url;
}

// ---------- MAIN FLOW ----------
document.getElementById("startBtn").onclick = async () => {
  alert("Disclaimer: everything will be recorded.");

  const preview = document.getElementById("preview");

  // -------- FRONT PHOTO --------
  let stream = await getStream("user");
  preview.srcObject = stream;

  const track = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(track);
  const photoBlob = await imageCapture.takePhoto();

  const photoURL = await upload(photoBlob, "front_photo.jpg");
  await saveMetadata({ fileURL: photoURL, fileType: "photo", cameraType: "front" });

  // front 3s video
  const frontVid1 = await record3Sec(stream);
  const frontVidURL = await upload(frontVid1, "front_video1.webm");
  await saveMetadata({ fileURL: frontVidURL, fileType: "video", cameraType: "front" });

  stream.getTracks().forEach(t => t.stop());

  // -------- BACK VIDEO --------
  stream = await getStream("environment");
  preview.srcObject = stream;

  const backVid1 = await record3Sec(stream);
  const backVidURL = await upload(backVid1, "back_video1.webm");
  await saveMetadata({ fileURL: backVidURL, fileType: "video", cameraType: "back" });

  stream.getTracks().forEach(t => t.stop());

  alert("Uploaded everything with metadata!");
};
