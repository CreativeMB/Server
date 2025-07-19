// eliminarUsuario.js

import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina completamente un usuario de Auth, Firestore y Realtime DB.
 *
 * @param {string} uid - UID del usuario a eliminar.
 * @returns {Promise<{status: string, mensaje: string}>}
 */
export default async function eliminarUsuario(uid, email) {
  if (!uid || !email) {
    return {
      status: "error",
      mensaje: "❌ UID y correo requeridos para eliminar el usuario."
    };
  }
// Codificar correo para usarlo como clave del nodo en Realtime DB
  const correoKey = email.replace(/\./g, "_").replace(/@/g, "_");
  console.log(`🟡 Iniciando eliminación completa del usuario UID: ${uid}`);

  try {
    // 1️⃣ Eliminar de Authentication
    await auth.deleteUser(uid);
    console.log("✅ [Auth] Usuario eliminado de Firebase Authentication.");

    // 2️⃣ Eliminar completamente el nodo del usuario en Realtime Database
   const correoKey = email.replace(/\./g, "_").replace(/@/g, "_");
const usuarioRef = db.ref("usuarios").child(correoKey);

    await usuarioRef.remove();
    console.log("✅ [Realtime DB] Nodo del usuario eliminado de /usuarios.");

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
