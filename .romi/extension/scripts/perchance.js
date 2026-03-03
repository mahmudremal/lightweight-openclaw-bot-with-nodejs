// class ImageSrcExtractor {
//   constructor() {
//     this.iframeSelector = "iframe.text-to-image-plugin-image-iframe";
//     this.imageSelector = "#resultImgEl";
//     this.iframeOrigin = "https://image-generation.perchance.org";
//   }

//   sendMessageToIframe(iframe) {
//     const iframeWindow = iframe.contentWindow;
//     if (iframeWindow) {
//       iframeWindow.postMessage(
//         {
//           type: "getImageSrc",
//           message: "Please send the image source URL",
//         },
//         "*",
//       );
//     }
//   }

//   listenForIframeMessages() {
//     window.addEventListener("message", (event) => {
//       if (event.origin !== this.iframeOrigin) {
//         return;
//       }

//       if (event.data.type === "getImageSrc") {
//         const imageSrc = event.data.src;
//         if (imageSrc) {
//           console.log("Extracted image src:", imageSrc);
//         }
//       }
//     });
//   }

//   observeImageGeneration(iframeWindow) {
//     const iframeDocument = iframeWindow.document;
//     const observer = new MutationObserver(() => {
//       const image = iframeDocument.querySelector(this.imageSelector);
//       if (image && image.src) {
//         console.log("Image src found:", image.src);
//         observer.disconnect();
//       }
//     });

//     observer.observe(iframeDocument.body, {
//       childList: true,
//       subtree: true,
//     });
//   }

//   handleDynamicIframes() {
//     const iframes = document.querySelectorAll(this.iframeSelector);
//     iframes.forEach((iframe) => {
//       this.sendMessageToIframe(iframe);
//       this.observeImageGeneration(iframe.contentWindow);
//     });
//   }

//   start() {
//     this.listenForIframeMessages();
//     document.addEventListener("DOMContentLoaded", () => {
//       this.handleDynamicIframes();
//     });
//   }
// }

// const imageSrcExtractor = new ImageSrcExtractor();
// imageSrcExtractor.start();
// alert("Script working...");

// scripts/background.js
// chrome.webNavigation.onCompleted.addListener(
//   (details) => {
//     if (
//       details.url.startsWith(
//         "https://3c8810f4be02cd08220952c272a370cb.perchance.org/",
//       )
//     ) {
//       chrome.scripting.executeScript({
//         target: { tabId: details.tabId, frameIds: [details.frameId] },
//         func: () => {
//           const images = [];
//           window.addEventListener("message", (event) => {
//             if (!event.data || event.data.type !== "finished") return;
//             images.push({
//               id: event.data.id,
//               dataUrl: event.data.dataUrl,
//             });
//             window.parent.postMessage(
//               { type: "images", payload: images },
//               "https://perchance.org",
//             );
//           });
//         },
//       });
//     } else if (details.url.startsWith("https://perchance.org")) {
//       chrome.scripting.executeScript({
//         target: { tabId: details.tabId },
//         func: () => {
//           window.addEventListener("message", (event) => {
//             console.log(event.data.payload);
//             if (event.data?.type === "images") {
//               window.generated_images = event.data.payload;
//               console.log("Received images:", event.data.payload);
//             }
//           });
//         },
//       });
//     } else {
//     }
//   },
//   {
//     url: [
//       { hostEquals: "3c8810f4be02cd08220952c272a370cb.perchance.org" },
//       { hostEquals: "perchance.org" },
//     ],
//   },
// );
