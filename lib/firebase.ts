import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCriQCH5NI8zdjSL9SzfUIWG_hS8V0EjAA",
  authDomain: "e-commerce-application-d0ef9.firebaseapp.com",
  projectId: "e-commerce-application-d0ef9",
  storageBucket: "e-commerce-application-d0ef9.appspot.com",
  messagingSenderId: "100600391381",
  appId: "1:100600391381:web:a77039043d41715e48645c"
};

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 