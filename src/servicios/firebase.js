
// Archivo: firebase.js
const decodedCredentials = Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf-8');
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

// Exportamos las instancias de los servicios que usaremos en la aplicación.
export const auth = admin.auth();
export const firestore = admin.firestore();
export const db = admin.database();```
**Mejoras:**
*   **Manejo de Entornos**: El código ahora es robusto y funciona tanto en desarrollo (leyendo `credenciales.json`) como en producción (leyendo una variable de entorno `FIREBASE_CREDENTIALS`).
*   **Error Crítico**: Si Firebase no puede inicializarse, la aplicación se detiene. Esto previene errores inesperados más adelante.
*   **Variables de Entorno**: La URL de la base de datos también se obtiene de `.env` para mayor flexibilidad.

---

### **3. Módulo para Eliminar Usuario (`eliminarUsuario.js`)**

Has hecho un buen trabajo separando la lógica. Aquí está la versión pulida, que ahora importa las dependencias de Firebase desde nuestro módulo centralizado.

```javascript
// Archivo: eliminarUsuario.js
import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina un usuario de todos los servicios de Firebase (Auth, Firestore, RealtimeDB)
 * y sus documentos asociados.
 * @param {string} uid - El ID del usuario a eliminar.
 * @returns {Promise<{status: string, mensaje: string}>} Resultado de la operación.
 */
export default async function eliminarUsuario(uid) {
  try {
    // 1. Eliminar de Firebase Authentication
    // Esta es la fuente de verdad. Si falla aquí, no continuamos.
    await auth.deleteUser(uid);
    console.log(`✅ Auth eliminado para UID: ${uid}`);

    // 2. Eliminar de Firestore (colección 'users')
    const userDocRef = firestore.collection("users").doc(uid);
    await userDocRef.delete();
    console.log(`✅ Documento de Firestore eliminado para UID: ${uid}`);

    // 3. Eliminar de Realtime Database
    const userDbRef = db.ref("usuarios_conectados").child(uid);
    await userDbRef.remove();
    console.log(`✅ Entrada de Realtime DB eliminada para UID: ${uid}`);

    // 4. Eliminar documentos dependientes (ej. pedidos) en un batch
    const pedidosQuery = firestore.collection("pedidosmovies").where("userId", "==", uid);
    const pedidosSnapshot = await pedidosQuery.get();

    if (!pedidosSnapshot.empty) {
      const batch = firestore.batch();
      pedidosSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ ${pedidosSnapshot.size} pedido(s) del usuario han sido eliminados.`);
    }

    return { status: "ok", mensaje: "Usuario eliminado completamente de todos los servicios." };

  } catch (error) {
    console.error(`❌ Error procesando la eliminación del usuario ${uid}:`, error);

    // Personalizamos el mensaje de error para casos comunes
    if (error.code === 'auth/user-not-found') {
      return { status: "error", mensaje: `El usuario con UID ${uid} no existe en Firebase Authentication.` };
    }
    
    return { status: "error", mensaje: "Ocurrió un error interno al eliminar el usuario." };
  }
}
