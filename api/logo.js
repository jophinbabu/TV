module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  try {
    const upstream = await fetch(
      "http://his.amalaims.org:9090/file/getCommonFile/image/headerlogo.png",
      { signal: AbortSignal.timeout(12000) },
    );
    if (!upstream.ok) return res.status(502).end("Could not load hospital logo");

    const image = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(image);
  } catch (error) {
    return res.status(502).end("Could not load hospital logo");
  }
};
