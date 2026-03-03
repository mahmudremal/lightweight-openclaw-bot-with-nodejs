import http from "http";

const PORT = 8765;
const MODE = process.argv[2];
const PROMPT = process.argv.slice(3).join(" ");

if (!MODE || !PROMPT) {
  console.log("Usage: node nanobanana.js <image|music> <prompt>");
  process.exit(1);
}

const request = (path, method, data) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: PORT,
        path,
        method,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(JSON.parse(body)));
      },
    );
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

const exec = async (action, params = {}, id = null) => {
  return request("/api/browsers/exec", "POST", { id, action, params });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const selectors = {
  images:
    ".extension-processing-state + .response-content .model-response-text .attachment-container.generated-images .generated-image .image",
  musics:
    ".extension-processing-state + .response-content .model-response-text .attachment-container.generated-musics .generated-music .audio",
};

async function run() {
  try {
    const clients = await request("/api/browsers", "GET");
    if (!clients.length) throw new Error("No browser connected");
    const clientId = clients[0].id;

    console.log(
      `${MODE == "image" ? "🎨" : "🎧"} Starting ${MODE} generation...`,
    );

    if (!["image", "music"].includes(MODE)) {
      throw new Error(
        "Invalid mode. Only image & music generation mode are allowed.",
      );
    }

    console.log(`🌐 Navigating to gemini...`);

    const response = await exec(
      "create",
      {
        url: "https://gemini.google.com/app",
        untilLoad: false,
        incognito: false,
      },
      clientId,
    );

    const tabId = response.tab.id;
    console.log(`⏳ Wait for 5s...`);
    await sleep(5000);

    const selector =
      MODE === "image"
        ? ".card-container.ng-star-inserted button.card.card-zero-state[aria-label*=image]"
        : ".card-container.ng-star-inserted button.card.card-zero-state[aria-label*=music]";

    console.log(`🖱️ Clicking on ${MODE} generation button`);
    await exec(
      "waitFor",
      {
        selector: selector,
        state: "visible",
        timeout: 60000,
      },
      clientId,
    );

    await exec("click", { selector }, clientId);
    console.log(`⏳ Wait for 3s...`);
    await sleep(3000);

    console.log(`✍️ Writing prompt...`);
    await exec(
      "write",
      {
        selector: ".ql-editor",
        text: `<p>${PROMPT}</p>`,
        editor: "quill",
        keyPress: "Enter,13",
      },
      clientId,
    );

    console.log(`⏳ Wait for 15s...`);
    await sleep(15000);
    console.log(`${MODE == "image" ? "🖼️" : "🎶"} Waiting for generation...`);

    await exec(
      "waitFor",
      {
        selector: Object.values(selectors).join(", "),
        state: "visible",
        timeout: 60000,
      },
      clientId,
    );

    await sleep(3000);

    const genRes =
      MODE == "image"
        ? await exec(
            "getElements",
            {
              selector: selectors.images,
              attribute: "src",
            },
            clientId,
          )
        : await exec(
            "getElements",
            {
              selector: selectors.musics,
              attribute: "src",
            },
            clientId,
          );

    const result = {
      [MODE]: genRes.results || [],
    };
    console.log("\n✅ Generation Complete:");
    console.log(JSON.stringify(result, null, 2));

    await exec(
      "click",
      {
        selector:
          ".conversation-items-container > a.selected + .conversation-actions-container > button",
      },
      clientId,
    );
    await sleep(3000);

    await exec(
      "click",
      {
        selector:
          ".cdk-overlay-pane .conversation-actions-menu  .mat-mdc-menu-content [data-test-id='delete-button']",
      },
      clientId,
    );
    await sleep(1000);

    await exec(
      "click",
      {
        selector:
          ".mdc-dialog--open .mdc-dialog__actions .mdc-button[data-test-id='confirm-button']",
      },
      clientId,
    );
    await sleep(1000);

    await exec("close", { tabId }, clientId);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

run();
