module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const date = typeof req.query.date === "string" ? req.query.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "A date in YYYY-MM-DD format is required" });
  }

  const upstreamUrl =
    "http://his.amalaims.org:9090/bldget/invcommonget/rnbbsudonordashboard " +
    "'" + date + "','" + date + "',NULL";

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) {
      return res.status(502).json({ message: "Amala Live returned an error", upstreamStatus: upstream.status });
    }

    const payload = await upstream.json();
    const datalist = payload && payload.data && payload.data.datalist;
    if (payload.success === false || !Array.isArray(datalist)) {
      return res.status(502).json({ message: "Unexpected donor data from Amala Live" });
    }

    // Return only fields used by the public donor board.
    const safeDatalist = datalist.map((donor) => ({
      datalistid: donor.datalistid,
      donorName: donor.donorName,
      status: donor.status,
      color: donor.color,
      registrationtime: donor.registrationtime,
      donationtype: donor.donationtype,
    }));

    const countKeys = {
      all: "all",
      registered: "registered",
      tested: "tested",
      fit: "fit",
      bleeding: "bleeding",
      donated: "donated",
      deferred: "deferred",
    };
    const countSources = [
      payload.counts,
      payload.data && payload.data.counts,
      payload.data && payload.data.summary,
      payload.data && payload.data.statusCounts,
      payload.data && payload.data.statuscounts,
      payload.data,
      payload,
    ];
    let safeCounts = null;
    for (const source of countSources) {
      if (!source || typeof source !== "object" || Array.isArray(source)) continue;
      const counts = {};
      for (const [key, value] of Object.entries(source)) {
        const target = countKeys[key.toLowerCase().replace(/[^a-z]/g, "")];
        if (target && value !== "" && Number.isFinite(Number(value))) counts[target] = Number(value);
      }
      if (Object.keys(counts).length) {
        safeCounts = counts;
        break;
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      httpstatus: 200,
      data: { datalist: safeDatalist, counts: safeCounts },
    });
  } catch (error) {
    return res.status(502).json({ message: "Could not reach Amala Live donor API" });
  }
};
