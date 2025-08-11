// Persistencia mínima de geolocalizaciones en Supabase
// saveGeolocation(lat, lon, address, origin)
// Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY si políticas lo permiten)

async function saveGeolocation(lat, lon, address, origin) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return; // Silencioso si falta config
  try {
    const base = url.replace(/\/$/, '') + '/rest/v1/geolocalizaciones';
    // Buscar registro existente
    const query = `${base}?latitud=eq.${lat}&longitud=eq.${lon}&origen=eq.${encodeURIComponent(origin)}&select=id,ocurrencias`;
    let resp = await fetch(query, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json'
      }
    });
    if (!resp.ok) return;
    const existing = await resp.json();
    if (Array.isArray(existing) && existing.length) {
      const row = existing[0];
      const patchUrl = `${base}?id=eq.${row.id}`;
      const body = { ocurrencias: (row.ocurrencias || 0) + 1, direccion: address };
      await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'apikey': key,
            'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
      });
      return;
    }
    // Insertar nuevo
    const insertBody = {
      latitud: lat,
      longitud: lon,
      direccion: address,
      origen: origin,
      ocurrencias: 1
    };
    await fetch(base, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(insertBody)
    });
  } catch (_) {
    // Silencioso
  }
}

module.exports = { saveGeolocation };
