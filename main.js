// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyt3BbmlFu9nCEYRm7So5sa8AfPBSwzqg",
  authDomain: "tu-foodies.firebaseapp.com",
  projectId: "tu-foodies",
  storageBucket: "tu-foodies.firebasestorage.app",
  messagingSenderId: "572794985084",
  appId: "1:572794985084:web:8f79f1077ada26b94047f9"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export { signInWithPopup };
