export default async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const multi = url.searchParams.get("multi") === "1";

  if (!q) {
    return new Response(JSON.stringify({ error: "Falta la ciudad" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const limit = multi ? 6 : 1;
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&accept-language=es&addressdetails=1`;
    const res = await fetch(nomUrl, {
      headers: { "User-Agent": "RotorAzimut/1.0 (rotor-azimut.netlify.app)" }
    });
    const data = await res.json();

    if (!data || !data.length) {
      return new Response(JSON.stringify({ error: `"${q}" no encontrado` }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const results = data.map(p => {
      // Nombre corto: ciudad + país
      const addr = p.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || addr.state || "";
      const country = addr.country || "";
      const name = [city, country].filter(Boolean).join(", ") || p.display_name.split(",").slice(0,2).join(",").trim();
      return {
        name,
        lat: parseFloat(p.lat),
        lon: parseFloat(p.lon),
      };
    });

    // Deduplicar por lat/lon aproximado
    const seen = new Set();
    const unique = results.filter(r => {
      const key = `${r.lat.toFixed(1)},${r.lon.toFixed(1)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (multi) {
      return new Response(JSON.stringify({ results: unique }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } else {
      return new Response(JSON.stringify(unique[0]), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = { path: "/api/city" };
