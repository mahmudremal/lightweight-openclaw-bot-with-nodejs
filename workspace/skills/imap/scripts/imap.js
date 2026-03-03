const tls = require("tls");

const emailConfigs = [
  {
    user: "info@abc.com",
    pass: "your_password",
    host: "imap.abc.com",
    port: 993,
  },
];

const args = process.argv.slice(2);
const getArg = (key) => {
  const idx = args.indexOf(key);
  return idx !== -1 ? args[idx + 1] : null;
};

const mailArg = getArg("--mail");
let config = emailConfigs.find((c) => c.user === mailArg) || {};

const options = {
  host: getArg("--host") || config.host || mailArg?.split("@")[1],
  port: parseInt(getArg("--port")) || config.port || 993,
  user: getArg("--username") || config.user || mailArg,
  pass: getArg("--password") || config.pass,
  action:
    getArg("--action") ||
    args[args.indexOf("list") === -1 ? -1 : args.indexOf("list")] ||
    "list",
  id: getArg("--id"),
  limit: parseInt(getArg("--limit")) || 10,
};

class ImapClient {
  constructor(opt) {
    this.opt = opt;
    this.tagCount = 0;
    this.socket = null;
    this.buffer = "";
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = tls.connect(this.opt.port, this.opt.host, () => resolve());
      this.socket.on("data", (d) => (this.buffer += d.toString()));
      this.socket.on("error", reject);
    });
  }

  async send(cmd) {
    const tag = `a${++this.tagCount}`;
    this.socket.write(`${tag} ${cmd}\r\n`);
    return new Promise((resolve) => {
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
        }
      }, 100);
    });
  }

  async run() {
    await this.connect();
    await this.send(`LOGIN ${this.opt.user} ${this.opt.pass}`);
    await this.send("SELECT INBOX");

    if (this.opt.action === "list") {
      const res = await this.send(
        `FETCH 1:${this.opt.limit} (BODY[HEADER.FIELDS (FROM SUBJECT DATE)])`,
      );
      console.log("\n📬 Recent Emails:");
      console.log(res.replace(/\* \d+ FETCH /g, "\n-------------------\n"));
    } else if (this.opt.action === "read" && this.opt.id) {
      const res = await this.send(`FETCH ${this.opt.id} BODY[TEXT]`);
      console.log(`\n📖 Content of Email ${this.opt.id}:`);
      console.log(res);
    } else if (this.opt.action === "delete" && this.opt.id) {
      await this.send(`STORE ${this.opt.id} +FLAGS (\\Deleted)`);
      await this.send("EXPUNGE");
      console.log(`\n🗑️ Email ${this.opt.id} deleted.`);
    }

    this.socket.end();
  }
}

if (!options.user || !options.pass || !options.host) {
  console.log("Usage:");
  console.log("  Configured: node imap.js --mail <email> <list|read|delete>");
  console.log(
    "  Inline:     node imap.js --host <host> --username <user> --password <pass> --action <list|read|delete>",
  );
  process.exit(1);
}

new ImapClient(options).run().catch(console.error);
