// eliminarUsuario.js

import { auth, firestore, db } from "./firebase.js";

/**
 * Elimina completamente un usuario por su correo codificado (clave en Realtime DB),
 * incluyendo Firebase Authentication, Realtime Database y Firestore.
 *
 * @param {string} email - Correo del usuario (ej: "usuario@gmail.com")
 * @returns {Promise<{status: string, mensaje: string}>}
 */
export default async function eliminarUsuario(email) {
  if (!email) {
    return {
      status: "error",
      mensaje: "❌ Correo requerido para eliminar el usuario."
    };
  }

  // Codificar correo como clave válida en Firebase
  const correoKey = email.replace(/\./g, "_").replace(/@/g, "_");
  const usuarioRef = db.ref("usuarios").child(correoKey);

  try {
    console.log(`🟡 Verificando nodo: usuarios/${correoKey}`);

    // Obtener el nodo del usuario directamente
    const snapshot = await usuarioRef.once("value");

    if (!snapshot.exists()) {
      return {
        status: "error",
        mensaje: `❗ No se encontró el nodo de usuario con correo: ${email}`
      };
    }

    const data = snapshot.val();
    const uid = data.userId;

    console.log(`✅ Nodo encontrado. UID del usuario: ${uid}`);

    // 1️⃣ Eliminar de Firebase Authentication
    await auth.deleteUser(uid);
    console.log("✅ [Auth] Usuario eliminado de Firebase Authentication.");

    // 2️⃣ Eliminar el nodo del usuario en Realtime DB
    await usuarioRef.remove();
    console.log(`✅ [Realtime DB] Nodo eliminado: usuarios/${correoKey}`);

    // 3️⃣ Eliminar pedidos del usuario en Firestore
    const pedidosSnap = await firestore
      .collection("pedidosmovies")
      .where("userId", "==", uid)
      .get();

    if (!pedidosSnap.empty) {
      const batch = firestore.batch();
      pedidosSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ [Firestore] ${pedidosSnap.size} pedido(s) eliminados.`);
    } else {
      console.log("ℹ️ [Firestore] Sin pedidos del usuario.");
    }

    // 4️⃣ Eliminar documento en colección 'users'
    const userDocRef = firestore.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.delete();
      console.log("✅ [Firestore] Documento eliminado de colección 'users'.");
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
