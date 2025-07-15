// Archivo: firebase.js
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
  // Ideal para producción (ej. Vercel, Heroku) donde se inyectan las credenciales como una variable de entorno.
  if (process.env.FIREBASE_CREDENTIALS) {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } else {
    // Para desarrollo local, cargamos el archivo directamente.
    // Usamos import() dinámico para cargar el JSON.
    const { default: localAccount } = await import("./credenciales.json", {
      assert: { type: "json" },
    });
    serviceAccount = localAccount;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log("✅ Firebase Admin SDK inicializado correctamente.");

} catch (error) {
  console.error("❌ Error crítico al inicializar Firebase Admin:", error);
  // Si Firebase no inicia, la aplicación no puede funcionar.
  process.exit(1);
}


