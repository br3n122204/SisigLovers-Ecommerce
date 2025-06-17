import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCC7yrxwLctzMBuWvIZAMrcsCyRldaTfGY",
  authDomain: "dpt-one-e-commer-website.firebaseapp.com",
  projectId: "dpt-one-e-commer-website",
  storageBucket: "dpt-one-e-commer-website.firebasestorage.app",
  messagingSenderId: "1093944051787",
  appId: "1:1093944051787:web:12bcf81fe18e41c275a5ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db }; 