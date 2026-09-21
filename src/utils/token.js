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
    // 1. Manejar reemplazo de caracteres URL-Safe
    let str = token.trim().replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    // Rellenar padding de '=' si falta
    while (str.length % 4) {
      str += '=';
    }

    const raw = atob(str);
    let parsed;
    try {
      parsed = JSON.parse(decodeURIComponent(escape(raw)));
    } catch (e1) {
      parsed = JSON.parse(raw);
    }

    if (!parsed || typeof parsed !== 'object') return null;

    // Normalizar tanto formato compacto ({p, d, f}) como formato clásico ({para, de, flores})
    const normalized = {
      para: parsed.para || parsed.p || 'Amiga',
      de: parsed.de || parsed.d || 'Aymar',
      flores: []
    };

    if (Array.isArray(parsed.flores)) {
      normalized.flores = parsed.flores.map(item => ({
        id: item.id !== undefined ? item.id : item.i,
        titulo: item.titulo || item.t,
        msg: item.msg || item.m,
        foto: item.foto || item.pic || ""
      }));
    } else if (Array.isArray(parsed.f)) {
      normalized.flores = parsed.f.map(item => {
        const entry = { id: item.i !== undefined ? item.i : item.id };
        if (item.t || item.titulo) entry.titulo = item.t || item.titulo;
        if (item.m || item.msg) entry.msg = item.m || item.msg;
        if (item.pic || item.foto) entry.foto = item.pic || item.foto;
        return entry;
      });
    } else if (parsed.msg) {
      normalized.msg = parsed.msg;
    }

    return normalized;
  } catch (err) {
    console.warn("No se pudo decodificar el token:", err);
    return null;
  }
}
