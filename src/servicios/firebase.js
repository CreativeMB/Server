// Archivo: firebase.js

import admin from "firebase-admin";
import dotenv from "dotenv";

// Carga las variables de entorno del archivo .env (principalmente para desarrollo local)
dotenv.config();

let serviceAccount;

// ---- LÓGICA DE DETECCIÓN DE ENTORNO (PRODUCCIÓN vs. DESARROLLO) ----

// Si la variable de entorno FIREBASE_CREDENTIALS existe (configurada en los Secrets de Fly.io)
if (process.env.FIREBASE_CREDENTIALS) {
  console.log("ℹ️ Detectado entorno de producción. Cargando credenciales de Firebase desde Secrets...");
  
  try {
    // Decodificamos la cadena Base64 que guardamos en los Secrets de Fly.io
    const decodedCredentials = Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf-8');
    // Parseamos el string JSON decodificado para obtener el objeto de credenciales
    serviceAccount = JSON.parse(decodedCredentials);
  } catch (error) {
    console.error("❌ ERROR CRÍTICO: No se pudieron parsear las credenciales de Firebase desde la variable de entorno. Asegúrate de que el secreto FIREBASE_CREDENTIALS esté bien configurado y sea un Base64 válido.", error);
    process.exit(1); // Detiene la aplicación si las credenciales son inválidas
  }

} else {
  // Si no, asumimos que estamos en desarrollo local y buscamos el archivo credenciales.json
  console.log("ℹ️ Detectado entorno de desarrollo. Cargando credenciales de Firebase desde el archivo local 'credenciales.json'...");
  try {
    const { default: localAccount } = await import("./credenciales.json", {
      assert: { type: "json" },
    });
    serviceAccount = localAccount;
  } catch (error) {
     console.error("❌ ERROR CRÍTICO: No se encontró o no se pudo leer el archivo 'credenciales.json' en el entorno local. Asegúrate de que el archivo exista en la raíz del proyecto.", error);
     process.exit(1); // Detiene la aplicación si no encuentra el archivo local
  }
}

// ---- INICIALIZACIÓN DE FIREBASE ADMIN SDK ----
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Leemos la URL de la base de datos desde las variables de entorno también
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log("✅ Firebase Admin SDK inicializado y conectado exitosamente.");

} catch (error) {
  console.error("❌ ERROR CRÍTICO: Falló la inicialización de Firebase Admin SDK. Verifica que las credenciales y la URL de la base de datos sean correctas.", error.message);
  process.exit(1); // Detiene la aplicación si la inicialización falla
}

// Exportamos las instancias de los servicios de Firebase para que otros archivos puedan usarlas
export const auth = admin.auth();
export const firestore = admin.firestore();
export const db = admin.database();
