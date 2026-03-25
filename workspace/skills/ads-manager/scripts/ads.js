import fs from "fs";
import meta from "./ads-system/meta.js";
import tiktok from "./ads-system/tiktok.js";
import google from "./ads-system/google.js";
import twitter from "./ads-system/twitter.js";
import linkedin from "./ads-system/linkedin.js";
import requestManager from "./ads-system/request.js";
import utility from "./ads-system/utility.js";

const platforms = { meta, tiktok, google, twitter, linkedin };

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
    const { platform, action, data, attachment } = this.args;
    
    if (["syncAccounts", "mapPlatformIds"].includes(action)) {
      console.log(JSON.stringify(utility[action](this.secrets || {}, data)));
      return;
    }

    const secretKey = (platform.startsWith("google") || platform === "youtube") ? "google" : platform;
    if (!this.secrets || !this.secrets[secretKey]) {
      console.log(JSON.stringify({ error: `Secret for platform ${platform} not configured` }));
      return;
    }

    try {
      const parsedData = data ? JSON.parse(data) : {};
      parsedData.attachments = utility.parseAttachments(attachment);
      this.args.data = parsedData;

      const pKey = platform.startsWith("google") || platform === "youtube" ? "google" : platform;
      const platformMod = platforms[pKey];
      if (!platformMod) {
        console.log(JSON.stringify({ error: "Platform not found" }));
        return;
      }

      let reqOpts = platformMod.getConfig(action, this.args, this.secrets[secretKey], platform);
      if (reqOpts && reqOpts.valid !== undefined) {
        console.log(JSON.stringify(reqOpts));
        return;
      }
      
      if (!reqOpts) {
        console.log(JSON.stringify({ error: `Unsupported action ${action} for ${platform}` }));
        return;
      }

      const res = await requestManager.send(reqOpts.method, reqOpts.url, reqOpts.headers, reqOpts.body);
      utility.logActivity(action, platform, res);
      console.log(JSON.stringify(res));
    } catch (e) {
      console.log(JSON.stringify({ error: e.message }));
    }
  }
}

new Ads();
