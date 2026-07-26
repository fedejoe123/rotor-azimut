export default async (req) => {
  const url = new URL(req.url);
  const call = url.searchParams.get("call");

  if (!call) {
    return new Response(JSON.stringify({ error: "Falta el indicativo" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const QRZ_USER = Netlify.env.get("QRZ_USER");
  const QRZ_PASS = Netlify.env.get("QRZ_PASS");

  try {
    // 1. Obtener session key
    const loginUrl = `https://xmldata.qrz.com/xml/current/?username=${encodeURIComponent(QRZ_USER)}&password=${encodeURIComponent(QRZ_PASS)}&agent=rotor-azimut`;
    const loginRes = await fetch(loginUrl);
    const loginXml = await loginRes.text();

    const keyMatch = loginXml.match(/<Key>([^<]+)<\/Key>/);
    if (!keyMatch) {
      return new Response(JSON.stringify({ error: "Login QRZ fallido" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const key = keyMatch[1];

    // 2. Buscar el indicativo
    const lookupUrl = `https://xmldata.qrz.com/xml/current/?s=${key}&callsign=${encodeURIComponent(call.toUpperCase())}`;
    const lookupRes = await fetch(lookupUrl);
    const lookupXml = await lookupRes.text();

    // Parsear campos clave
    const get = (tag) => {
      const m = lookupXml.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`));
      return m ? m[1] : null;
    };

    const lat = parseFloat(get("lat"));
    const lon = parseFloat(get("lon"));

    if (isNaN(lat) || isNaN(lon)) {
      return new Response(JSON.stringify({ error: `Indicativo ${call.toUpperCase()} no encontrado en QRZ` }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const result = {
      call: get("call") || call.toUpperCase(),
      fname: get("fname"),
      name: get("name"),
      addr2: get("addr2"),
      country: get("country"),
      grid: get("grid"),
      lat,
      lon,
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
  path: "/api/qrz"
};
