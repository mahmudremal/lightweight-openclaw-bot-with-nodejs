import tls from "tls";

/* ================= CONFIG LIST ================= */

const emailConfigs = [
  {
    user: "info@abc.com",
    pass: "your_password",
    host: "imap.abc.com",
    port: 993,
  },
  {
    user: "bdcodehaxor@gmail.com",
    pass: "iefg hwmn hvvt hqkz",
    host: "imap.gmail.com",
    port: 993,
  },
];

/* ================= UTIL ================= */

function decodeMimeWord(str = "") {
  return str.replace(
    /=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g,
    (_, charset, enc, text) => {
      if (enc.toUpperCase() === "B") {
        return Buffer.from(text, "base64").toString("utf8");
      } else {
        return Buffer.from(
          text
            .replace(/_/g, " ")
            .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
              String.fromCharCode(parseInt(hex, 16)),
            ),
          "binary",
        ).toString("utf8");
      }
    },
  );
}

function stripHtml(html = "") {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeQuotedPrintable(str = "") {
  return Buffer.from(
    str
      .replace(/=\r?\n/g, "") // soft line breaks
      .replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      ),
    "binary",
  ).toString("utf8");
}

function extractTextPlain(raw = "") {
  const boundaryMatch = raw.match(/boundary="?([^"\r\n;]+)"?/i);
  if (!boundaryMatch) return raw;

  const boundary = boundaryMatch[1];
  const parts = raw.split(`--${boundary}`);

  for (const part of parts) {
    if (/Content-Type:\s*text\/plain/i.test(part)) {
      return part
        .split(/\r?\n\r?\n/)
        .slice(1)
        .join("\n\n");
    }
  }

  return raw;
}

/* ================= IMAP CLIENT ================= */

class ImapClient {
  constructor(opt) {
    this.opt = opt;
    this.tagCount = 0;
    this.socket = null;
    this.buffer = "";
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = tls.connect(
        {
          host: this.opt.host,
          port: this.opt.port || 993,
          rejectUnauthorized: false,
        },
        () => setTimeout(resolve, 500),
      );

      this.socket.on("data", (d) => (this.buffer += d.toString()));
      this.socket.on("error", reject);
    });
  }

  async send(cmd) {
    const tag = `a${++this.tagCount}`;
    this.socket.write(`${tag} ${cmd}\r\n`);

    return new Promise((resolve, reject) => {
      const start = Date.now();

      const check = setInterval(() => {
        if (
          this.buffer.includes(`${tag} OK`) ||
          this.buffer.includes(`${tag} NO`) ||
          this.buffer.includes(`${tag} BAD`)
        ) {
          clearInterval(check);
          const res = this.buffer;
          this.buffer = "";
          resolve(res);
        } else if (Date.now() - start > 15000) {
          clearInterval(check);
          reject(new Error("IMAP timeout"));
        }
      }, 100);
    });
  }

  async login() {
    const res = await this.send(`LOGIN "${this.opt.user}" "${this.opt.pass}"`);
    if (!res.includes("OK")) throw new Error("Login failed");
    await this.send("SELECT INBOX");
  }

  async list() {
    const res = await this.send(
      `UID FETCH 1:* (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])`,
    );

    console.log("\n📬 Recent Emails:\n");

    const items = res.split(/\* (?=\d+ FETCH)/).filter(Boolean);
    const sliced = items.reverse().slice(0, this.opt.limit);

    sliced.forEach((item) => {
      const uidMatch = item.match(/UID (\d+)/);
      if (!uidMatch) return;
      const uid = uidMatch[1];

      const subject = decodeMimeWord(
        (item.match(/Subject: (.*)/) || [])[1] || "",
      ).replace(/\r?\n\s/g, " ");

      const from = decodeMimeWord((item.match(/From: (.*)/) || [])[1] || "");

      const date = (item.match(/Date: (.*)/) || [])[1] || "";

      console.log(`\x1b[36m[UID: ${uid}]\x1b[0m \x1b[1m${subject}\x1b[0m`);
      console.log(`   \x1b[90mFrom: ${from} | ${date}\x1b[0m\n`);
    });
  }

  async read(uid) {
    const res = await this.send(`UID FETCH ${uid} (BODY.PEEK[])`);

    let raw = res
      .replace(/^[^\{]+\{\d+\}\r?\n/, "")
      .replace(/\)\r?\na\d+ OK[\s\S]*/s, "")
      .trim();

    // Extract text/plain part
    let body = extractTextPlain(raw);

    // Decode quoted-printable
    body = decodeQuotedPrintable(body);

    console.log(`\n📖 Email ${uid}:\n`);
    console.log(body.trim());
  }

  async delete(uid) {
    await this.send(`UID STORE ${uid} +FLAGS (\\Deleted)`);
    await this.send("EXPUNGE");
    console.log(`\n🗑️ Email ${uid} deleted.`);
  }

  async run() {
    await this.connect();
    await this.login();

    if (this.opt.action === "list") await this.list();
    else if (this.opt.action === "read" && this.opt.id)
      await this.read(this.opt.id);
    else if (this.opt.action === "delete" && this.opt.id)
      await this.delete(this.opt.id);

    this.socket.end();
  }
}

/* ================= CLI ================= */

const args = process.argv.slice(2);
const getArg = (key) => {
  const i = args.indexOf(key);
  return i !== -1 ? args[i + 1] : null;
};

const mailArg = getArg("--mail");
let config = emailConfigs.find((c) => c.user === mailArg);

const options = {
  host: getArg("--host") || config?.host,
  port: parseInt(getArg("--port")) || config?.port || 993,
  user: getArg("--username") || mailArg || config?.user,
  pass: getArg("--password") || config?.pass,
  action:
    getArg("--action") ||
    (args.includes("read")
      ? "read"
      : args.includes("delete")
        ? "delete"
        : "list"),
  id: getArg("--id"),
  limit: parseInt(getArg("--limit")) || 10,
};

if (!options.user || !options.pass || !options.host) {
  console.log("Usage:");
  console.log("node scripts/imap.js --mail user@example.com list");
  console.log(
    "node scripts/imap.js --host imap.gmail.com --username user@gmail.com --password app_pass --action list",
  );
  process.exit(1);
}

new ImapClient(options).run().catch(console.error);
