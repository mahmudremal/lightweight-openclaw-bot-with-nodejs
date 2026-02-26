/**
 * Below scripts are copied from another place where they LLM did something using this.
 * But our approatch will be completely different. Our background script will connect with romi bot anytime, with the script, it will connect using websocket or anything else, and get a real time messaging transfer communication between. from LLm, then it will request various commands, background scripts will do things onbehalf of this, and return result back. which will complete it's purpose.
 * Everything needs to be clean, comments free, OOP based.
 *
 * ./content.js is for tab content script which will be used for necessery commands or funcitons.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { func, params } = message;

  let url;
  if (func === "google_search") {
    url = `https://www.google.com/search?q=${encodeURIComponent(params[0])}`;
  } else if (func === "open_website") {
    url = params[0];
  }

  if (!url) {
    sendResponse({ success: false, message: "Unknown function" });
    return;
  }

  chrome.tabs.create({ url, active: false }, (tab) => {
    waitForTabAndExtract(tab.id, { toolFunc: func, params }, (data) => {
      chrome.tabs.remove(tab.id);
      sendResponse({
        success: true,
        action: func,
        data: data,
      });
    });
  });

  return true;
});

function waitForTabAndExtract(tabId, { toolFunc, params }, callback) {
  const listener = (id, changeInfo, tab) => {
    if (id === tabId && changeInfo.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);

      // Inject script to get text
      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          args: [{ toolFunc, params }],
          func: ({ toolFunc, params }) => {
            if (toolFunc === "google_search") {
              let searchResults = [
                ...document.querySelectorAll(".MjjYud > div"),
              ]
                .map((card) => ({
                  url: [...card.querySelectorAll("a")]
                    .map((e) => e?.href)
                    .find((i) => i),
                  title: [...card.querySelectorAll("h3")]
                    .map((e) => e?.innerText)
                    .find((i) => i),
                  excerpt: [
                    ...card.querySelectorAll(".kb0PBd.A9Y9g, .ITZIwc.p4wth"),
                  ]
                    .map((e) => e?.innerText)
                    .find((i) => i),
                }))
                .filter((i) => i.url && i.title && i.excerpt)
                .map(
                  ({ url, title, excerpt }) =>
                    `Title: ${title}\nURL: ${url}\nExcerpt: ${excerpt}\n`,
                )
                .join("\n");
              const gmb = [...document.querySelectorAll("#jOAHU")]
                .map((el) => {
                  return [
                    [...el.querySelectorAll(".tsRboc, .pxiwBd.EyBRub")]
                      .map((e) => e.innerText)
                      .join("\n"),
                    [
                      ...el.querySelectorAll(
                        '.wDYxhc[data-attrid="kc:/common/topic:social media presence"] a',
                      ),
                    ]
                      .map((e) => ({ url: e.href, label: e.innerText }))
                      .map(({ url, label }) => `${label}: ${url}`)
                      .join("\n"),
                  ]
                    .filter((i) => i)
                    .join("\n");
                })
                .join("\n");
              if (gmb) {
                searchResults += "\n" + gmb;
              }
              return searchResults || "No search results found.";
            } else if (toolFunc === "open_website") {
              const articleBody =
                document.querySelector("article") ||
                document.querySelector("main") ||
                document.body;
              if (!articleBody) {
                return null;
              }

              return articleBody.innerText
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 10000);
              // Increased limit for better context
            } else {
              return null;
            }
          },
        })
        .then((results) => {
          const text = results[0]?.result || null;
          callback(text || "");
        })
        .catch((err) => {
          callback("Error extracting content: " + err.message);
        });
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
}
