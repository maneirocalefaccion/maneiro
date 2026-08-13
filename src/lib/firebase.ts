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
    // Handle escaped newlines from environment variables
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

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
