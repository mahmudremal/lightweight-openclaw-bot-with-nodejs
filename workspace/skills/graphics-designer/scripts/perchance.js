/**
 * Skip it for now, it looks like it has some issue.
 *
 * perchance.org is a sophisticated, advanced AI generators over image, video, text to audio generator with unlimited limitations.
 * We can use this tool to generate whatever we want.
 */

/**
 * Here is how to use it
 *
 * https://perchance.org/best-ai-image-generator create tab with this link
 * document.querySelector('.container #userInput') is the input field where to put detailed prompt of generation,
 * document.querySelector('.container #userInput + button') is the button to click after typing prompt.
 *
 * wait for 30s first, then wait for images selections,
 *
 */
const get_images = () =>
  [
    ...document.querySelectorAll("iframe.text-to-image-plugin-image-iframe"),
  ].map((i) => i?.textToImagePluginOutput?.dataUrl);

while (get_images().some((i) => !i)) {
  await sleep(2000);
}

/**
 * We need to implemnt others tool as well to give LLM complete flexibility to whatever it needs to do.
 *
 */
/*
Craiyon: The most popular "no-login" option. It offers unlimited free generations (ad-supported) with nine variations per prompt.
Mage.space: Allows instant generation using the Stable Diffusion model without a login. It is often faster and has fewer restrictions than other guest-mode tools.
Perchance AI: A community-run tool that provides fast, unlimited image generation from text with no login or daily credit gimmicks.
Hugging Face Spaces: You can use cutting-edge open-source models like Flux.1 or SDXL for free through community-hosted demos without an account. 
2. High Free Limits (Login Required)
These services offer more image generation than Gemini's free tier if you are willing to log in with Google or Microsoft. 
Playground AI: This service provides up to 500 images per day for free users as of early 2026.
Microsoft Designer (Bing Image Creator): This service provides 15 "boosts" per day for faster generation. After using these, you can still generate images for free, but at a slower speed, with no daily limit.
Leonardo.ai: This service grants 150 tokens every 24 hours (resets daily), which typically allows for 15–30 high-quality images, depending on the model.
Ideogram: Known for good text rendering in images, this service offers 10 credits per day (generating 4 images per credit), totaling approximately 40 images daily. 
YouTube
YouTube
 +6
 */
