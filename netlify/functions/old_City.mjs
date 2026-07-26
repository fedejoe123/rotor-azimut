export default async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return new Response(JSON.stringify({ error: "Falta la ciudad" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=es`;
    const res = await fetch(nomUrl, {
      headers: { "User-Agent": "RotorAzimut/1.0" }
    });
    const data = await res.json();

    if (!data || !data[0]) {
      return new Response(JSON.stringify({ error: `Ciudad "${q}" no encontrada` }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const place = data[0];
    const result = {
      name: place.display_name.split(",").slice(0, 2).join(",").trim(),
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = {
  path: "/api/city"
};
