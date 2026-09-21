// Utilidades de codificación y decodificación URL-Safe para dedicatorias con fotos

export function encodeToken(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    // Codificación segura UTF-8 y URL-safe (sin '+', '/', o '=')
    return btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (err) {
    console.error("Error al codificar token:", err);
    return "";
  }
}

export function decodeToken(token) {
  if (!token) return null;
  try {
    // 1. Manejar reemplazo de espacios si vinieron por URL
    let str = token.trim().replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    // Rellenar padding de '=' si falta
    while (str.length % 4) {
      str += '=';
    }

    const raw = atob(str);
    try {
      return JSON.parse(decodeURIComponent(escape(raw)));
    } catch (e1) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("No se pudo decodificar el token:", err);
    return null;
  }
}
