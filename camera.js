// ====== FIREBASE ======
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// Correct Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA5HSha0laFzd9rQZw5sAHW6O1BcX8BPzI",
  authDomain: "pdfniba.firebaseapp.com",
  projectId: "pdfniba",
  storageBucket: "pdfniba.appspot.com",
  messagingSenderId: "809688909652",
  appId: "1:809688909652:web:9867944191bd95704aaac1"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);


// ====== CAMERA SETUP ======

const video = document.getElementById("video");
const canvas = document.createElement("canvas");
const toggleBtn = document.getElementById("toggleCamera");

let currentFacingMode = "environment"; // start with back camera

async function startCamera() {
  try {
    const constraints = {
      video: { facingMode: currentFacingMode }
    };

    console.log("Trying camera:", constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();

    console.log("Camera started:", currentFacingMode);

  } catch (err) {
    console.warn("Back camera failed, switching to front.", err);

    // fallback to front camera
    currentFacingMode = "user";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });

    video.srcObject = stream;
    await video.play();

    console.log("Front camera started.");
  }
}

toggleBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

startCamera();


// ====== CAPTURE + FIREBASE UPLOAD ======

document.getElementById("capture").addEventListener("click", async () => {
  console.log("Capturing image...");

  // Draw video frame to canvas
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  const base64Image = canvas.toDataURL("image/jpeg");

  console.log("Uploading to Firebase Storage...");

  // Upload to storage
  const filename = "capture_" + Date.now() + ".jpg";
  const imageRef = ref(storage, "captures/" + filename);

  try {
    await uploadString(imageRef, base64Image, "data_url");
    const downloadURL = await getDownloadURL(imageRef);

    console.log("Stored image URL:", downloadURL);

    // Save Firestore record
    await addDoc(collection(db, "captures"), {
      imageUrl: downloadURL,
      timestamp: Date.now()
    });

    console.log("Saved to Firestore successfully!");

    alert("Upload Complete!");

  } catch (err) {
    console.error("Upload or Firestore error:", err);
  }
});
