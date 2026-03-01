/**
 * Utility to format markdown for different chat platforms
 */

export class Formatter {
  /**
   * Format text for WhatsApp
   * @param {string} text
   * @returns {string}
   */
  static toWhatsApp(text) {
    if (!text) return "";

    let formatted = text;

    // 1. Code blocks (do these first)
    // Remove language tag if present and wrap in triple backticks
    formatted = formatted.replace(/```(?:\w+)?\n([\s\S]*?)```/g, "```$1```");

    // 2. Inline Code (only if not already inside triple backticks)
    // We replace backticks with triple backticks for WhatsApp monospace
    formatted = formatted.replace(/(?<!`)`([^`\n]+)`(?!`)/g, "```$1```");

    // 3. Headings (WhatsApp doesn't support them, use Bold CAPS)
    formatted = formatted.replace(
      /^#+ (.*)$/gm,
      (match, p1) => `*${p1.toUpperCase()}*`,
    );

    // 4. Bold (**text** -> *text*)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "*$1*");

    // 5. Italic (*text* or _text_ -> _text_)
    // Use negative lookahead/lookbehind to avoid matching bold markers
    formatted = formatted.replace(
      /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g,
      "_$1_",
    );
    formatted = formatted.replace(/_(.*?)_/g, "_$1_");

    // 6. Strike (~text~ -> ~text~)
    formatted = formatted.replace(/~~(.*?)~~/g, "~$1~");

    // 7. Links [text](url) -> text: url
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, "$1: $2");

    // 8. Lists
    formatted = formatted.replace(/^\s*[-*]\s+/gm, "• ");

    return formatted.trim();
  }

  /**
   * Format text for Telegram (HTML mode)
   * @param {string} text
   * @returns {string}
   */
  static toTelegramHTML(text) {
    if (!text) return "";

    let formatted = text;

    // Escape basic HTML markers first
    formatted = formatted
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    formatted = formatted.replace(/^# (.*)$/gm, "<b>$1</b>");
    formatted = formatted.replace(/^## (.*)$/gm, "<b>$1</b>");
    formatted = formatted.replace(/^### (.*)$/gm, "<b><i>$1</i></b>");

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, "<i>$1</i>");
    formatted = formatted.replace(/_(.*?)_/g, "<i>$1</i>");

    // Inline Code
    formatted = formatted.replace(/`(.*?)`/g, "<code>$1</code>");

    // Code blocks
    formatted = formatted.replace(
      /```(?:\w+)?\n([\s\S]*?)```/g,
      "<pre>$1</pre>",
    );

    return formatted.trim();
  }
}

export default Formatter;
