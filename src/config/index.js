import dotenv from "dotenv";
dotenv.config();

export const config = {
  puppeteer: {
    browserPath: process.env.PUPPETEER_BROWSER_PATH || undefined,
    headless: process.env.WA_HEADLESS !== "false",
  },
};
