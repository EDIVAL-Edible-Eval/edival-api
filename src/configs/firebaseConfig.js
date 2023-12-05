import dotenv from "dotenv";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import credentials from "../../key.json" assert { type: "json" }

dotenv.config()
admin.initializeApp({
    credential: admin.credential.cert(credentials),
    storageBucket : process.env.STORAGE_BUCKET
})

const db = admin.firestore();
const auth = admin.auth();
const bucket = getStorage().bucket();

export default {db, auth, bucket}