require("dotenv").config(); // Đọc các biến môi trường từ tệp .env
const admin = require("firebase-admin");
const algoliasearch = require("algoliasearch");

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix private key line breaks
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
});

const db = admin.firestore();

// Initialize Algolia
const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const index = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME);

// Function to sync Firestore → Algolia
async function syncJobs() {
    try {
        const snapshot = await db.collection("jobs").get();
        const jobs = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            data.objectID = doc.id;
            jobs.push(data);
        });

        if (jobs.length > 0) {
            await index.saveObjects(jobs);
            console.log(`${jobs.length} jobs synced to Algolia`);
        } else {
            console.log("No jobs found.");
        }
    } catch (error) {
        console.error("Error syncing jobs:", error);
    }
}

syncJobs().catch(console.error);