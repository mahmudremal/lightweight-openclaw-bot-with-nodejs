import https from "https";

const BASE_URL = "https://urmoonlitmeadow.uxndev.com/wp-json/store/agent";

const args = process.argv.slice(2);
const command = args[0];

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const getArg = (key) => {
  const arg = args.find((a) => a.startsWith(key));
  return arg ? arg.split("=")[1] : null;
};

const display = (data) => {
  if (!data || (Array.isArray(data) && data.length === 0))
    return console.log("No results.");
  if (!Array.isArray(data)) data = [data];

  const keys = Object.keys(data[0]);
  console.log(
    "\n" +
      keys
        .map((k) => `\x1b[1m\x1b[32m${k.toUpperCase().padEnd(20)}\x1b[0m`)
        .join(" | "),
  );
  console.log("-".repeat(keys.length * 23));

  data.forEach((item) => {
    console.log(
      keys
        .map((k) => {
          let val = item[k];
          if (typeof val === "object") val = JSON.stringify(val);
          return String(val).padEnd(20).substring(0, 20);
        })
        .join(" | "),
    );
  });
  console.log("\n");
};

const run = async () => {
  try {
    if (command === "products" || command === "orders" || command === "order") {
      const endpoint = command === "products" ? "products" : "orders";
      const params = new URLSearchParams();
      args.forEach((a) => {
        if (a.startsWith("--")) {
          const [k, v] = a.replace("--", "").split("=");
          params.append(k, v);
        }
      });
      const res = await fetch(`${BASE_URL}/${endpoint}?${params}`, {
        // agent,
        // dispatcher: agent,
        rejectUnauthorized: false,
      });
      display(await res.json());
    } else if (command === "update" && args[1] === "order") {
      const id = args[2];
      const action = args[3];
      const dataStr = getArg("--data") || "{}";
      const res = await fetch(`${BASE_URL}/orders/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: dataStr,
        // agent,
        // dispatcher: agent,
        rejectUnauthorized: false,
      });
      console.log(`\n\x1b[1mUpdate Status: ${res.status}\x1b[0m`);
      display(await res.json());
    } else {
      console.log("Usage:");
      console.log("  node store.js products --search=watch");
      console.log("  node store.js orders --email=test@example.com");
      console.log(
        '  node store.js update order <id> <status|refund|items|actions|notes> --data=\'{"status":"completed"}\'',
      );
    }
  } catch (err) {
    console.error("\x1b[31mError:\x1b[0m", err.message);
  }
};

run();
