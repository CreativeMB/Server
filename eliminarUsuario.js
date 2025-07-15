// Archivo: eliminarUsuario.js

// Importamos los servicios YA INICIALIZADOS desde nuestro módulo central
import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina un usuario de todos los servicios de Firebase.
 * @param {string} uid El ID del usuario a eliminar.
 * @returns {Promise<{status: string, mensaje: string}>} Un objeto con el resultado de la operación.
 */
export default async function eliminarUsuario(uid) {
  try {
    // 1. Eliminar de Firebase Authentication
    await auth.deleteUser(uid);
    console.log(`✅ Auth eliminado para UID: ${uid}`);

    // 2. Eliminar de Firestore (colección 'users')
    await firestore.collection("users").doc(uid).delete();
    console.log(`✅ Documento de Firestore eliminado para UID: ${uid}`);

    // 3. Eliminar de Realtime Database (usuarios conectados)
    await db.ref("usuarios_conectados").child(uid).remove();
    console.log(`✅ Entrada de Realtime DB eliminada para UID: ${uid}`);

    // 4. Eliminar documentos relacionados (pedidos)
    const pedidosSnapshot = await firestore.collection("pedidosmovies").where("userId", "==", uid).get();
    
    if (pedidosSnapshot.empty) {
      console.log("ℹ️ El usuario no tenía pedidos para eliminar.");
    } else {
      const batch = firestore.batch(); // Usamos un batch para eliminar en una sola operación
      pedidosSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ ${pedidosSnapshot.size} pedidos del usuario eliminados.`);
    }

    return { status: "ok", mensaje: "Usuario eliminado completamente de todos los servicios." };

  } catch (error) {
    console.error(`❌ Error al eliminar el usuario ${uid}:`, error);
    // Personalizamos el mensaje de error si el usuario no se encuentra
    if (error.code === 'auth/user-not-found') {
        return { status: "error", mensaje: "El usuario no existe en Firebase Authentication." };
    }
    return { status: "error", mensaje: error.message };
  }
}
