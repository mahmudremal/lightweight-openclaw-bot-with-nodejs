import fs from "fs";
import path from "path";

class Utils {
  readJson(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new Utils();