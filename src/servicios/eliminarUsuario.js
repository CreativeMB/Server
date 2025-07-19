// eliminarUsuario.js

import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina completamente un usuario de Auth, Firestore y Realtime DB.
 *
 * @param {string} uid - UID del usuario en Firebase Auth
 * @returns {Promise<{status: string, mensaje: string}>}
 */
export default async function eliminarUsuario(uid) {
  if (!uid) {
    return {
      status: "error",
      mensaje: "❌ UID requerido para eliminar el usuario."
    };
  }
// Codificar correo para usarlo como clave del nodo en Realtime DB
  console.log(`🟡 Iniciando eliminación completa del usuario UID: ${uid}`);

  try {
    // 1️⃣ Eliminar usuario de Firebase Authentication
    await auth.deleteUser(uid);
    console.log("✅ [Auth] Usuario eliminado de Firebase Authentication.");

    // 2️⃣ Buscar y eliminar el nodo en Realtime Database por userId
    const usuariosRef = db.ref("usuarios");
    const snapshot = await usuariosRef.once("value");

    let nodoEncontrado = null;

    snapshot.forEach(childSnapshot => {
      const data = childSnapshot.val();
      if (data.userId === uid) {
        nodoEncontrado = childSnapshot.key;
      }
    });

    if (nodoEncontrado) {
      await usuariosRef.child(nodoEncontrado).remove();
      console.log(`✅ [Realtime DB] Nodo eliminado: /usuarios/${nodoEncontrado}`);
    } else {
      console.log("ℹ️ [Realtime DB] No se encontró el nodo con ese userId.");
    }
    // 3️⃣ Eliminar todos sus pedidos en Firestore
    const pedidosSnapshot = await firestore
      .collection("pedidosmovies")
      .where("userId", "==", uid)
      .get();

    if (!pedidosSnapshot.empty) {
      const batch = firestore.batch();
      pedidosSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ [Firestore] ${pedidosSnapshot.size} pedido(s) eliminados.`);
    } else {
      console.log("ℹ️ [Firestore] Sin pedidos del usuario.");
    }

    // 4️⃣ Eliminar cualquier otro rastro del usuario en otras colecciones (ej: users)
    const userDoc = firestore.collection("users").doc(uid);
    await userDoc.delete().then(() => {
      console.log("✅ [Firestore] Documento del usuario eliminado de colección 'users'.");
    }).catch(() => {
      console.log("ℹ️ [Firestore] No había documento en 'users'.");
    });

    return {
      status: "ok",
      mensaje: `✅ Usuario ${uid} eliminado completamente de Auth, Realtime DB y Firestore.`
    };

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);

    if (error.code === "auth/user-not-found") {
      return {
        status: "error",
        mensaje: `❗ El usuario con UID ${uid} no existe en Authentication.`
      };
    }

    return {
      status: "error",
      mensaje: "❌ Error inesperado al eliminar el usuario."
    };
  }
}
