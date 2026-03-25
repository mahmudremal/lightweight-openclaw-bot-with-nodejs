import fs from "fs";
import path from "path";
class Utility {
  syncAccounts(secrets) {
    return { status: "success", accounts: Object.keys(secrets) };
  }
  mapPlatformIds(data) {
    return { status: "success", mapped: data };
  }
  logActivity(action, platform, res) {
    try {
      const logStr = `\n[${new Date().toISOString()}] ${platform}:${action} -> ${res.status || res.error || "OK"}`;
      fs.appendFileSync("./ads-activity.log", logStr);
    } catch (e) {}
    return true;
  }
  parseAttachments(attachmentStr) {
    if (!attachmentStr) return [];
    return attachmentStr.split(",").map(file => {
      if (fs.existsSync(file)) return { filename: path.basename(file), content: fs.readFileSync(file, "base64") };
      return null;
    }).filter(a => a);
  }
}
export default new Utility();
