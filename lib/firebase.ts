import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCriQCH5NI8zdjSL9SzfUIWG_hS8V0EjAA",
  authDomain: "dpt-one-e-commerce.firebaseapp.com",
  projectId: "dpt-one-e-commerce",
  storageBucket: "dpt-one-e-commerce.firebasestorage.app",
  messagingSenderId: "100600391381",
  appId: "1:100600391381:web:a77039043d41715e48645c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db }; 