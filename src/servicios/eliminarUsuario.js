// Archivo: eliminarUsuario.js

// Importamos las instancias YA INICIALIZADAS desde nuestro módulo central de Firebase.
// Esto asegura que no estamos creando múltiples conexiones.
import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina un usuario de todos los servicios de Firebase (Auth, Firestore, RealtimeDB)
 * y todos sus documentos relacionados, como los pedidos.
 *
 * @param {string} uid - El ID único (UID) del usuario que se va a eliminar.
 * @returns {Promise<{status: string, mensaje: string}>} Un objeto que indica el resultado de la operación.
 */
export default async function eliminarUsuario(uid) {
  // Verificación de entrada: Asegurarse de que el UID no sea nulo o indefinido.
  if (!uid) {
    console.error("❌ Intento de eliminación sin UID.");
    return { status: "error", mensaje: "Se requiere un UID para eliminar un usuario." };
  }

  console.log(`🟡 Iniciando proceso de eliminación para el usuario con UID: ${uid}`);

  try {
    // ---- PASO 1: Eliminar de Firebase Authentication ----
    // Este es el paso más crítico. Si falla aquí, no continuamos.
    await auth.deleteUser(uid);
    console.log(`✅ [Auth] Usuario eliminado exitosamente de Firebase Authentication.`);

    // ---- PASO 2: Eliminar de Firestore (Colección 'users') ----
    const userDocRef = firestore.collection("users").doc(uid);
    await userDocRef.delete();
    console.log(`✅ [Firestore] Documento del usuario eliminado de la colección 'users'.`);

    // ---- PASO 3: Eliminar de Realtime Database ----
    const userDbRef = db.ref("usuarios_conectados").child(uid);
    await userDbRef.remove();
    console.log(`✅ [Realtime DB] Entrada del usuario eliminada de 'usuarios_conectados'.`);

    // ---- PASO 4: Eliminar documentos dependientes (Pedidos) ----
    // Usamos un 'batch' para eliminar todos los pedidos en una sola operación atómica.
    // Esto es más eficiente y económico que eliminarlos uno por uno.
    const pedidosQuery = firestore.collection("pedidosmovies").where("userId", "==", uid);
    const pedidosSnapshot = await pedidosQuery.get();

    if (pedidosSnapshot.empty) {
      console.log("ℹ️ El usuario no tenía pedidos asociados para eliminar.");
    } else {
      const batch = firestore.batch();
      pedidosSnapshot.docs.forEach(doc => {
        console.log(`  -> Marcando para eliminar pedido con ID: ${doc.id}`);
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ [Firestore] ${pedidosSnapshot.size} pedido(s) del usuario han sido eliminados en un batch.`);
    }

    // Si todos los pasos fueron exitosos, retornamos un mensaje de éxito.
    return { status: "ok", mensaje: `Usuario ${uid} y todos sus datos han sido eliminados completamente.` };

  } catch (error) {
    console.error(`❌ Error crítico durante la eliminación del usuario ${uid}:`, error);

    // Personalizamos el mensaje de error para los casos más comunes y evitar exponer detalles internos.
    if (error.code === 'auth/user-not-found') {
      return { status: "error", mensaje: `Operación fallida: El usuario con UID ${uid} no existe en Firebase Authentication.` };
    }
    
    // Para cualquier otro tipo de error, devolvemos un mensaje genérico.
    return { status: "error", mensaje: "Ocurrió un error inesperado en el servidor al intentar eliminar el usuario." };
  }
}
