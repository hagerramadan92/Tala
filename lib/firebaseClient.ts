
// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyDofBQX5zsScMOpe0lX_mFkg6EWo8We4JA",
//   authDomain: "ecommerce-9161a.firebaseapp.com",
//   projectId: "ecommerce-9161a",
//   storageBucket: "ecommerce-9161a.firebasestorage.app",
//   messagingSenderId: "1034296304853",
//   appId: "1:1034296304853:web:8803ee7201d740ae092e5c",
//   measurementId: "G-X47MBXE9QZ"
// };

// function initFirebase() {
//   if (!getApps().length) {
//     return initializeApp(firebaseConfig);
//   } else {
//     return getApp();
//   }
// }

// initFirebase();

// export const auth = getAuth();

// export const googleProvider = new GoogleAuthProvider();
// export const facebookProvider = new FacebookAuthProvider();


import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// ✅ Firebase config from env
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ Prevent re-init in Next.js
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ✅ Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const facebookProvider = new FacebookAuthProvider();
