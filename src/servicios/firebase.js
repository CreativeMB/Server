// Archivo: firebase.js
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

// ESTA ES LA PARTE IMPORTANTE PARA FLY.IO
if (process.env.FIREBASE_CREDENTIALS) {
  console.log("ℹ️ Cargando credenciales de Firebase desde la variable de entorno...");
  // Decodifica la cadena Base64 a un string JSON, y luego lo parsea.
  const decodedCredentials = Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf-8');
  serviceAccount = JSON.parse(decodedCredentials);
} else {
  // Esta parte es para cuando trabajas en tu máquina local
  console.log("ℹ️ Cargando credenciales de Firebase desde el archivo local credenciales.json...");
  const { default: localAccount } = await import("./credenciales.json", {
    assert: { type: "json" },
  });
  serviceAccount = localAccount;
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // Asegúrate de tener este secreto también
  });
  console.log("✅ Firebase Admin SDK inicializado correctamente.");
} catch (error) {
  console.error("❌ Error crítico al inicializar Firebase Admin:", error.message);
  process.exit(1);
}

// Exportamos las instancias para usarlas en otros archivos
export const auth = admin.auth();
export const firestore = admin.firestore();
export const db = admin.database();
