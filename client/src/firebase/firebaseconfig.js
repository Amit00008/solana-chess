import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBEBNZ3RmT0gG7F0oYaxIQ17jiWAbM0eiI",
  authDomain: "pumpfun-93b82.firebaseapp.com",
  projectId: "pumpfun-93b82",
  storageBucket: "pumpfun-93b82.firebasestorage.app",
  messagingSenderId: "850424682793",
  appId: "1:850424682793:web:5ef54df02819640115ff38",
  measurementId: "G-YK1NJWNM6M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { 
  db, 
  auth, 
  provider, 
  setDoc, 
  doc, 
  getDoc, 
  onSnapshot, 
  signInWithPopup, 
  signOut 
};
