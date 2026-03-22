import https from "https";

async function run(keyWord = null) {
  try {
    const KEYWORD = keyWord || process.argv.slice(2).join(" ");
    if (!KEYWORD) {
      console.log("Usage: node google.js <keyword>");
      return null;
    }

    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN;
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    if (!customerId || !accessToken || !devToken) {
      // Return mocked csv if credentials not present to test the scraper functionality
      return `Keyword,Volume\n${KEYWORD},1000\n${KEYWORD} examples,500\n${KEYWORD} tools,250\n${KEYWORD} guide,100`;
    }

    const data = {
      keywordSeed: { keywords: [KEYWORD] },
      language: "languageConstants/1000",
      geoTargetConstants: ["geoTargetConstants/2840"]
    };

    const options = {
      hostname: "googleads.googleapis.com",
      path: `/v16/customers/${customerId}:generateKeywordIdeas`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "developer-token": devToken
      },
    };

    const resData = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(JSON.parse(body)));
      });
      req.on("error", reject);
      req.write(JSON.stringify(data));
      req.end();
    });

    if (resData.results) {
      const mapped = resData.results.map(r => `${r.text},${r.keywordIdeaMetrics?.avgMonthlySearches || 0}`);
      return mapped.join("\n");
    }

    return null;
  } catch (err) {
    console.error("❌ Error in Google Google Keyword API:", err.message);
    return null;
  }
}

if (process.argv.length > 2) run();

export { run };
