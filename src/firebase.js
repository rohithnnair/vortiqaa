import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDiDNWC0E0yB8gk3E9EZ2l7beiA6U7ZM0o",
  authDomain: "vortiqaa.firebaseapp.com",
  projectId: "vortiqaa",
  storageBucket: "vortiqaa.firebasestorage.app",
  messagingSenderId: "962276638185",
  appId: "1:962276638185:web:851b8c1287335d1600df78",
  measurementId: "G-V1R2HW0Z2H"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export default app;
