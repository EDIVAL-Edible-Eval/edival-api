import dotenv from "dotenv";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import { getMessaging } from "firebase-admin/messaging"
import credentials from "../../key.json" assert { type: "json" }

dotenv.config()
admin.initializeApp({
    credential: admin.credential.cert(credentials),
    storageBucket : process.env.STORAGE_BUCKET
})

const db = admin.firestore();
const auth = admin.auth();
const bucket = getStorage().bucket();
const messaging = getMessaging();

export default {db, auth, bucket, messaging}