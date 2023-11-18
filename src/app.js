import dotenv from "dotenv";
import credentials from "../key.json" assert { type: "json" }
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { execSync } from 'child_process';

dotenv.config();

const app = express();

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize a firebase application
admin.initializeApp({
    credential: admin.credential.cert(credentials),
    storageBucket : process.env.STORAGE_BUCKET
})

// Define Storage Bucket and Firestore database
const bucket = getStorage().bucket();
const db = admin.firestore();

// Function to get gcloud access token
function getAccessToken() {
    try {
        // Execute 'gcloud auth print-access-token' and capture the output
        const accessToken = execSync('gcloud auth print-access-token').toString().trim();
        return accessToken;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        return null;
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw( {type: ["image/jpeg", "image/jpg", "image/png", "image/gif"], limit: "5mb"} ))

app.get('/', (req, res) => {
    const name = process.env.NAME || 'World';
    res.send(`Hello ${name}! Edival API is RUNNING`);
});

// POST: Manual sign-up for new user
app.post('/signup', async (req, res) => {
    getAuth()
        .createUser({
            email: req.body.email,
            emailVerified: req.body.emailVerified,
            phoneNumber: req.body.phoneNumber,
            password: req.body.password,
            displayName: req.body.displayName
        })
        .then((userRecord) => {
            const newUser = {
                username: userRecord.displayName,
                email: userRecord.email,
                phone: userRecord.phoneNumber,
                profile_img_path: null,
                theme_preference: null,
                language_preference: null
            }
            const response = db.collection("users").doc(userRecord.uid).set(newUser)
            res.send("OK")
        })
        .catch((error) => {
            res.send('Error creating new user:', error)
        });
})

// GET: All data of a user
// CAUTION : this is not get the id for each reminder. Need fixing
app.get('/user/:id', async (req, res) => {
    try {
        const usersRef = db.collection("users").doc(req.params.id);
        const response = await usersRef.get();
        const result = response.data()
        
        const reminder_snapshot = await usersRef.collection("reminders").get()
        result.reminders = reminder_snapshot.docs.map(doc => doc.data());

        res.send(result);
    } catch (error) {
        res.send(error)
    }
})

// POST: Update user profile
app.post('/update-user-profile/:id', async (req, res) => {
    try{
        const usersRef = db.collection("users").doc(req.params.id);
        let response = await usersRef.get();
        let cp_user = response.data();

        req.body.username && (cp_user.username = req.body.username)
        req.body.theme_preference && (cp_user.theme_preference = req.body.theme_preference)
        req.body.language_preference && (cp_user.language_preference = req.body.language_preference)

        await usersRef.update(cp_user);
        res.send("OK");
    }catch (error) {
        res.send(error)
    }
})

// POST: Update user image from raw binary data
app.post('/update-user-image/:id', upload.single("image_file"), async (req, res) => {
    try{

        const usersRef = db.collection("users").doc(req.params.id);
        let response = await usersRef.get();
        let cp_user = response.data();

        if (cp_user.profile_img_path){
            const prevFile = bucket.file(`${cp_user.profile_img_path}`)
            await prevFile.delete();
        }
        
        const file = bucket.file(`users/${req.params.id}/${req.file.originalname}`, {
            uploadType: {resumable: false},
            contentType: req.file.mimetype,
        });

        await file.save(req.file.buffer);
        
        cp_user.profile_img_path = `users/${req.params.id}/${req.file.originalname}`
        await usersRef.update(cp_user);
        
        res.send("OK")
    }catch (error) {
        res.send(error)
    }
})

// POST: Add reminder <- Parse nilai date ke nanosecond
app.post('/reminder/:id', async(req, res) => {
    try{
        const newReminder = {
            name : req.body.name,
            type : req.body.type,
            storage_type : req.body.storage_type,
            store_date : req.body.store_date,
            exp_date : req.body.exp_date,
            status : req.body.status
        }
        const file = bucket.file(`users/${req.params.id}/reminders/${req.file.originalname}`, {
            uploadType: {resumable: false},
            contentType: req.file.mimetype,
        });
        await file.save(req.file.buffer)

        newReminder.img_path = `users/${req.params.id}/reminders/${req.file.originalname}` 

        const response = await db.collection(`users/${req.params.id}/reminders`).add(newReminder);
        res.send("OK")
    }catch (error) {
        res.send(error)
    }
});

// DELETE: Remove reminder
app.delete('/reminder/:userId/:reminderId', async (req, res) => {
    try {
        const response = await db.collection(`users/${req.params.userId}/reminders`).doc(`${req.params.reminderId}`).delete();
        res.send(response)
    }catch (error) {
        res.send(error)
    }
})

// POST: Update reminder
app.post('/update-reminder/:userId/:reminderId', upload.single("image_file"), async (req, res) => {
    try {
        const reminderRef = db.collection(`users/${req.params.userId}/reminders`).doc(req.params.reminderId);
        let response = await reminderRef.get();
        let cpReminder = response.data()
        
        req.body.name && (cpReminder.name = req.body.name);
        req.body.type && (cpReminder.type = req.body.type);
        req.body.storage_type && (cpReminder.storage_type = req.body.storage);
        req.body.store_date && (cpReminder.store_date = req.body.store_date);
        req.body.exp_date && (cpReminder.exp_date = req.body.exp_date);
        req.body.status && (cpReminder.status = req.body.status);
        if (req.file){
            if (cpReminder.img_path){
                const prevFile = bucket.file(cpReminder.img_path);
                await prevFile.delete();
            }
            
            const file = bucket.file(`users/${req.params.userId}/reminders/${req.file.originalname}`, {
                uploadType: {resumable: false},
                contentType: req.file.mimetype,
            });
            await file.save(req.file.buffer)
            cpReminder.img_path = `users/${req.params.userId}/reminders/${req.file.originalname}`
        }
        await reminderRef.update(cpReminder)
        res.send("OK")
    }catch (error) {
        res.send(error)
    }
})

// POST: query the generative AI API (PALM)
app.post('/generative-ai', async (req, res) => {
    const query = req.body.query;

    const accessToken = getAccessToken();
    if (!accessToken) {
        res.status(500).json({ error: 'Unable to retrieve access token' });
        return;
    }

    try {
        const response = await axios.post(
            `https://${process.env.PALM_API_ENDPOINT}/v1/projects/${process.env.PROJECT_ID}/locations/${process.env.PALM_LOCATION}/publishers/google/models/${process.env.PALM_MODEL_ID}:predict`,
            {
                instances: [
                    {
                        content: query,
                    },
                ],
                parameters: {
                    candidateCount: 1,
                    maxOutputTokens: 1024,
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        res.json(response.data.predictions[0]);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`edival-api: listening on port ${port}`);
});
