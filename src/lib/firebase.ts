import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// Admin SDK initialization (for server-side API routes)
function getAdminDb() {
  const existingApps = getAdminApps();
  if (existingApps.length > 0) {
    return getAdminFirestore(existingApps[0]);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'maneiro-calefaccion';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  let adminApp;

  if (clientEmail && privateKey) {
    // Aggressively clean up the private key because Vercel env vars often have literal quotes or escaped newlines
    privateKey = privateKey.replace(/^"|"$/g, ''); // Remove surrounding quotes if they exist
    privateKey = privateKey.replace(/\\n/g, '\n'); // Convert literal \n to actual newlines

    adminApp = initAdminApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fallback: initialize without credentials (works in Google Cloud environments)
    adminApp = initAdminApp({ projectId });
  }

  return getAdminFirestore(adminApp);
}

export { getAdminDb };
