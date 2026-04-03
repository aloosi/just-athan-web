// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtP6gF7fR0MPMqJDufCEl7ifxlLgUYn8k",
  authDomain: "justathannotifications.firebaseapp.com",
  projectId: "justathannotifications",
  storageBucket: "justathannotifications.firebasestorage.app",
  messagingSenderId: "82916304795",
  appId: "1:82916304795:web:452a1a41864e23773e633e",
  measurementId: "G-NLP8ETW45N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);
// const analytics = getAnalytics(app);


export const generateToken = async () => {
    try {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
            return;
        }
        const permission = await Notification.requestPermission();
        console.log("Notification permission:", permission);
    } catch (error) {
        console.error("Error requesting notification permission:", error);
    }
}