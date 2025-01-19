// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxk_wGMSxJnaP-1cGJJVY-eQe0gxKIryo",
  authDomain: "agricult-ce0e3.firebaseapp.com",
  projectId: "agricult-ce0e3",
  storageBucket: "agricult-ce0e3.firebasestorage.app",
  messagingSenderId: "214344392349",
  appId: "1:214344392349:web:6967413117a8aca6a83e74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);