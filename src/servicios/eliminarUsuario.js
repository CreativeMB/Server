// eliminarUsuario.js

import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina completamente un usuario por su correo,
 * incluyendo Auth, Firestore y Realtime Database.
 *
 * @param {string} email - Correo del usuario (ej: "usuario@gmail.com")
 * @returns {Promise<{status: string, mensaje: string}>}
 */
export default async function eliminarUsuarioPorCorreo(email) {
  if (!email) {
    return {
      status: "error",
      mensaje: "❌ Correo requerido para eliminar el usuario."
    };
  }

  try {
    console.log(`🟡 Buscando UID de ${email}...`);
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`✅ UID encontrado: ${uid}`);
    console.log(`🟡 Iniciando eliminación completa del usuario UID: ${uid}`);

    // 1️⃣ Eliminar usuario de Firebase Authentication
    await auth.deleteUser(uid);
    console.log("✅ [Auth] Usuario eliminado de Firebase Authentication.");

    // 2️⃣ Buscar y eliminar nodo del usuario en Realtime Database (por userId)
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
      console.log("ℹ️ [Realtime DB] No se encontró nodo con ese userId.");
    }

    // 3️⃣ Eliminar todos los pedidos del usuario en Firestore
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

    // 4️⃣ Eliminar documento en colección 'users'
    const userDoc = firestore.collection("users").doc(uid);
    const userDocSnap = await userDoc.get();

    if (userDocSnap.exists) {
      await userDoc.delete();
      console.log("✅ [Firestore] Documento del usuario eliminado de colección 'users'.");
    } else {
      console.log("ℹ️ [Firestore] Documento no existe en colección 'users'.");
    }

    return {
      status: "ok",
      mensaje: `✅ Usuario ${uid} eliminado completamente de Auth, Realtime DB y Firestore.`
    };

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);

    if (error.code === "auth/user-not-found") {
      return {
        status: "error",
        mensaje: `❗ No existe un usuario con el correo ${email}.`
      };
    }

    return {
      status: "error",
      mensaje: "❌ Error inesperado al eliminar el usuario."
    };
  }
}

