import tls from "tls";
import fs from "fs";

/* ================= CONFIG LIST ================= */
const emailConfigs = fs.existsSync("./secrets.json")
  ? JSON.parse(fs.readFileSync("./secrets.json", "utf-8"))
  : [];

/* ================= UTIL ================= */
function decodeMimeWord(str = "") {
  return str.replace(
    /=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g,
    (_, charset, enc, text) => {
      if (enc.toUpperCase() === "B") return Buffer.from(text, "base64").toString("utf8");
      return Buffer.from(text.replace(/_/g, " ").replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))), "binary").toString("utf8");
    }
  );
}

function decodeQuotedPrintable(str = "") {
  return Buffer.from(str.replace(/=\r?\n/g, "").replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))), "binary").toString("utf8");
}

function extractTextPlain(raw = "") {
  const boundaryMatch = raw.match(/boundary="?([^"\r\n;]+)"?/i);
  if (!boundaryMatch) return raw;
  const parts = raw.split(`--${boundaryMatch[1]}`);
  for (const part of parts) {
    if (/Content-Type:\s*text\/plain/i.test(part)) return part.split(/\r?\n\r?\n/).slice(1).join("\n\n");
  }
  return raw;
}

const sendSmtpCmd = (socket, cmd) => {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (d) => {
      buf += d.toString();
      const lines = buf.split("\r\n");
      const lastLine = lines[lines.length - 2];
      if (lastLine && /^\d{3} /.test(lastLine)) {
        socket.off("data", onData);
        socket.off("error", onError);
        if (/^[45]/.test(lastLine)) reject(new Error(lastLine));
        else resolve(buf);
      }
    };
    const onError = (e) => reject(e);
    socket.on("data", onData);
    socket.on("error", onError);
    if (cmd) socket.write(cmd + "\r\n");
  });
};

/* ================= SMTP CLIENT ================= */
class SmtpClient {
  constructor(opt) { this.opt = opt; }
  async sendMail({ to, subject, body }) {
    return new Promise(async (resolve, reject) => {
      let host = this.opt.smtpHost || this.opt.host.replace("imap", "smtp");
      let port = this.opt.smtpPort || 465;
      let socket = tls.connect({ host, port, rejectUnauthorized: false });
      
      try {
        await sendSmtpCmd(socket, null);
        await sendSmtpCmd(socket, "EHLO localhost");
        await sendSmtpCmd(socket, "AUTH LOGIN");
        await sendSmtpCmd(socket, Buffer.from(this.opt.user).toString("base64"));
        await sendSmtpCmd(socket, Buffer.from(this.opt.pass).toString("base64"));
        await sendSmtpCmd(socket, `MAIL FROM:<${this.opt.user}>`);
        await sendSmtpCmd(socket, `RCPT TO:<${to}>`);
        await sendSmtpCmd(socket, "DATA");
        const msg = `From: ${this.opt.user}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}\r\n.`;
        await sendSmtpCmd(socket, msg);
        await sendSmtpCmd(socket, "QUIT");
        socket.end();
        resolve({ success: true });
      } catch (e) {
        socket.end();
        reject(e);
      }
    });
  }
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
      this.socket = tls.connect({ host: this.opt.host, port: this.opt.port || 993, rejectUnauthorized: false }, () => setTimeout(resolve, 500));
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
        if (this.buffer.includes(`${tag} OK`) || this.buffer.includes(`${tag} NO`) || this.buffer.includes(`${tag} BAD`)) {
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
    const res = await this.send(`UID FETCH 1:* (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])`);
    const items = res.split(/\* (?=\d+ FETCH)/).filter(Boolean);
    const sliced = items.reverse().slice(0, this.opt.limit);
    let out = [];
    sliced.forEach((item) => {
      const uidMatch = item.match(/UID (\d+)/);
      if (!uidMatch) return;
      out.push({
        uid: uidMatch[1],
        subject: decodeMimeWord((item.match(/Subject: ([^\r\n]+)/i) || [])[1] || "").replace(/\r?\n\s/g, " "),
        from: decodeMimeWord((item.match(/From: ([^\r\n]+)/i) || [])[1] || ""),
        date: (item.match(/Date: ([^\r\n]+)/i) || [])[1] || ""
      });
    });
    console.log(JSON.stringify(out));
  }

  async fetchSingle(uid) {
    const res = await this.send(`UID FETCH ${uid} (BODY.PEEK[])`);
    let raw = res.replace(/^[^\{]+\{\d+\}\r?\n/, "").replace(/\)\r?\na\d+ OK[\s\S]*/s, "").trim();
    let body = extractTextPlain(raw);
    body = decodeQuotedPrintable(body);
    const subject = decodeMimeWord((res.match(/Subject: ([^\r\n]+)/i) || [])[1] || "").replace(/\r?\n\s/g, " ");
    const from = decodeMimeWord((res.match(/From: ([^\r\n]+)/i) || [])[1] || "");
    const date = (res.match(/Date: ([^\r\n]+)/i) || [])[1] || "";
    let emailMatch = from.match(/<([^>]+)>/);
    let replyTo = emailMatch ? emailMatch[1] : from;
    return { uid, subject, from, replyTo, date, body: body.trim() };
  }

  async read(uid) {
    const mail = await this.fetchSingle(uid);
    console.log(JSON.stringify(mail));
  }

  async execStore(uid, action, flag) {
    await this.send(`UID STORE ${uid} ${flag}`);
    if (action === "delete") await this.send("EXPUNGE");
    console.log(JSON.stringify({ success: true, action, uid }));
  }

  async draft({ to, subject, body }) {
    const msg = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`;
    await this.send(`APPEND Drafts (\\Draft) {${Buffer.byteLength(msg)}}\r\n${msg}`);
    console.log(JSON.stringify({ success: true, action: "draft" }));
  }

  async reply(uid, replyText) {
    const mail = await this.fetchSingle(uid);
    const text = `${replyText}\r\n\r\n> On ${mail.date}, ${mail.from} wrote:\r\n> ${mail.body.replace(/\n/g, "\n> ")}`;
    await new SmtpClient(this.opt).sendMail({ to: mail.replyTo, subject: `Re: ${mail.subject}`, body: text });
    console.log(JSON.stringify({ success: true, action: "reply", uid }));
  }

  async forward(uid, to, fwdText) {
    const mail = await this.fetchSingle(uid);
    const text = `${fwdText}\r\n\r\n---------- Forwarded message ---------\r\nFrom: ${mail.from}\r\nDate: ${mail.date}\r\nSubject: ${mail.subject}\r\n\r\n${mail.body}`;
    await new SmtpClient(this.opt).sendMail({ to, subject: `Fwd: ${mail.subject}`, body: text });
    console.log(JSON.stringify({ success: true, action: "forward", uid, to }));
  }

  async run() {
    if (this.opt.action === "send") {
      await new SmtpClient(this.opt).sendMail(this.opt.data);
      console.log(JSON.stringify({ success: true, action: "send" }));
      return;
    }

    await this.connect();
    await this.login();

    const { action, id, data } = this.opt;
    if (action === "list") await this.list();
    else if (action === "read" && id) await this.read(id);
    else if (action === "delete" && id) await this.execStore(id, "delete", "+FLAGS (\\Deleted)");
    else if (action === "markSpam" && id) await this.execStore(id, "markSpam", "+FLAGS (\\Junk)");
    else if (action === "markRead" && id) await this.execStore(id, "markRead", "+FLAGS (\\Seen)");
    else if (action === "markUnread" && id) await this.execStore(id, "markUnread", "-FLAGS (\\Seen)");
    else if (action === "draft" && data) await this.draft(data);
    else if (action === "reply" && id && data) await this.reply(id, data.body || "");
    else if (action === "forward" && id && data) await this.forward(id, data.to, data.body || "");

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

let action = getArg("--action");
if (!action) {
  for (let a of ["read", "delete", "markSpam", "markRead", "markUnread", "draft", "send", "reply", "forward", "list"]) {
    if (args.includes(a)) { action = a; break; }
  }
}

const options = {
  host: getArg("--host") || config?.host,
  port: parseInt(getArg("--port")) || config?.port || 993,
  user: getArg("--username") || mailArg || config?.user,
  pass: getArg("--password") || config?.pass,
  action: action || "list",
  id: getArg("--id"),
  limit: parseInt(getArg("--limit")) || 10,
  data: getArg("--data") ? JSON.parse(getArg("--data")) : null,
};

if (!options.user || !options.pass || !options.host) {
  console.log(JSON.stringify({ error: "Missing config: user, pass, or host" }));
  process.exit(1);
}

new ImapClient(options).run().catch(e => console.log(JSON.stringify({ error: e.message })));
