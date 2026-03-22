import https from "https";
import fs from "fs";
import path from "path";

const request = (method, urlStr, headers, data) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(typeof data === "string" ? data : JSON.stringify(data));
    req.end();
  });
};

class Ads {
  constructor() {
    this.secretsFile = "./secrets.json";
    this.secrets = fs.existsSync(this.secretsFile) ? JSON.parse(fs.readFileSync(this.secretsFile)) : false;
    this.args = process.argv.slice(2).reduce((acc, arg) => {
      const [key, value] = arg.split("=");
      acc[key.replace("--", "")] = value;
      return acc;
    }, {});
    
    if (Object.keys(this.args).length > 0) this.init();
  }

  async init() {
    const { platform, action, campaignId, accountId, data, attachment } = this.args;
    const secretKey = (platform.startsWith("google") || platform === "youtube") ? "google" : platform;

    if (!this.secrets || !this.secrets[secretKey]) {
      console.log(JSON.stringify({ error: `Secret for platform ${platform} not configured` }));
      return;
    }

    try {
      const parsedData = data ? JSON.parse(data) : {};
      
      if (attachment) {
        parsedData.attachments = attachment.split(",").map(file => {
           if (fs.existsSync(file)) {
               return { filename: path.basename(file), content: fs.readFileSync(file, "base64") };
           }
           return null;
        }).filter(a => a);
      }

      const credentials = this.secrets[secretKey];
      let reqOpts = await this.getPlatformConfig(platform, action, campaignId, accountId, parsedData, credentials);
      
      if (!reqOpts) {
        console.log(JSON.stringify({ error: `Unsupported platform or action` }));
        return;
      }

      const res = await request(reqOpts.method, reqOpts.url, reqOpts.headers, reqOpts.body);
      console.log(JSON.stringify(res));
    } catch (e) {
      console.log(JSON.stringify({ error: e.message }));
    }
  }

  async getPlatformConfig(platform, action, campaignId, accountId, data, creds) {
    let config = { method: "GET", url: "", headers: {}, body: null };

    if (platform === "meta") {
      const baseUrl = "https://graph.facebook.com/v19.0";
      config.headers = { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" };
      if (action === "getCampaigns") config.url = `${baseUrl}/act_${accountId}/campaigns?fields=id,name,status`;
      else if (action === "createCampaign") { config.method = "POST"; config.url = `${baseUrl}/act_${accountId}/campaigns`; config.body = data; }
      else if (action === "updateCampaign") { config.method = "POST"; config.url = `${baseUrl}/${campaignId}`; config.body = data; }
      else return null;
      return config;
    }

    if (platform === "tiktok") {
      const baseUrl = "https://business-api.tiktok.com/open_api/v1.3";
      config.headers = { "Access-Token": creds.token, "Content-Type": "application/json" };
      if (action === "getCampaigns") config.url = `${baseUrl}/campaign/get/?advertiser_id=${accountId}`;
      else if (action === "createCampaign") { config.method = "POST"; config.url = `${baseUrl}/campaign/create/`; config.body = { advertiser_id: accountId, ...data }; }
      else if (action === "updateCampaign") { config.method = "POST"; config.url = `${baseUrl}/campaign/update/`; config.body = { advertiser_id: accountId, campaign_id: campaignId, ...data }; }
      else return null;
      return config;
    }

    if (platform.startsWith("google") || platform === "youtube") {
      const baseUrl = `https://googleads.googleapis.com/v16/customers/${accountId}`;
      config.headers = { 
        "Authorization": `Bearer ${creds.token}`, 
        "developer-token": creds.developerToken,
        "Content-Type": "application/json"
      };
      if (action === "getCampaigns") { config.method = "POST"; config.url = `${baseUrl}/googleAds:search`; config.body = { query: `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.advertising_channel_type = '${platform === 'youtube' ? 'VIDEO' : (platform === 'google-display' ? 'DISPLAY' : 'SEARCH')}'` }; }
      else if (action === "createCampaign") { config.method = "POST"; config.url = `${baseUrl}/campaigns:mutate`; config.body = { operations: [{ create: data }] }; }
      else if (action === "updateCampaign") { config.method = "POST"; config.url = `${baseUrl}/campaigns:mutate`; config.body = { operations: [{ update: data, updateMask: Object.keys(data).filter(k=>k!=='attachments').join(",") }] }; }
      else return null;
      return config;
    }

    if (platform === "twitter") {
      const baseUrl = "https://ads-api.twitter.com/12";
      config.headers = { "Authorization": `Bearer ${creds.token}`, "Content-Type": "application/json" };
      if (action === "getCampaigns") config.url = `${baseUrl}/accounts/${accountId}/campaigns`;
      else if (action === "createCampaign") { config.method = "POST"; config.url = `${baseUrl}/accounts/${accountId}/campaigns`; config.body = data; }
      else if (action === "updateCampaign") { config.method = "PUT"; config.url = `${baseUrl}/accounts/${accountId}/campaigns/${campaignId}`; config.body = data; }
      else return null;
      return config;
    }

    if (platform === "linkedin") {
      const baseUrl = "https://api.linkedin.com/rest";
      config.headers = { "Authorization": `Bearer ${creds.token}`, "LinkedIn-Version": "202306", "Content-Type": "application/json" };
      if (action === "getCampaigns") config.url = `${baseUrl}/adCampaigns?q=search&search=(account:(values:List(urn:li:sponsoredAccount:${accountId})))`;
      else if (action === "createCampaign") { config.method = "POST"; config.url = `${baseUrl}/adCampaigns`; config.body = data; }
      else if (action === "updateCampaign") { config.method = "POST"; config.url = `${baseUrl}/adCampaigns/${campaignId}`; config.headers["X-RestLi-Method"] = "PARTIAL_UPDATE"; config.body = { patch: { $set: data } }; }
      else return null;
      return config;
    }

    return null;
  }
}

new Ads();
