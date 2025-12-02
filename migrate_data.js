import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Environment Variable Loading (Node.js compatible) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnv = () => {
    try {
        const envPath = path.resolve(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            const env = {};
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    env[key.trim()] = value.trim();
                }
            });
            return env;
        }
    } catch (error) {
        console.error("Error loading .env file:", error);
    }
    return {};
};

console.log("Script started...");
const env = loadEnv();
console.log("Env loaded.");

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};
console.log("Firebase config prepared.");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_HOUSEHOLD_ID = "JbjDM4aq6Am2SN8IXXQa";

const migrateCollection = async (collectionName) => {
    console.log(`Starting migration for collection: ${collectionName}`);
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        let updatedCount = 0;

        const updates = querySnapshot.docs.map(async (document) => {
            const data = document.data();
            // Optional: Check if migration is needed to avoid redundant writes
            // But user said "migrate all", so we enforce it.
            if (data.householdId !== TARGET_HOUSEHOLD_ID) {
                await updateDoc(doc(db, collectionName, document.id), {
                    householdId: TARGET_HOUSEHOLD_ID
                });
                updatedCount++;
            }
        });

        await Promise.all(updates);
        console.log(`Completed ${collectionName}: Updated ${updatedCount} documents.`);
    } catch (error) {
        console.error(`Error migrating ${collectionName}:`, error);
    }
};

const runMigration = async () => {
    console.log(`Migrating data to household: ${TARGET_HOUSEHOLD_ID}`);
    await migrateCollection('items');
    await migrateCollection('types');
    await migrateCollection('units');
    console.log("Migration finished.");
    process.exit(0);
};

runMigration();
