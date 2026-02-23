import channels from "../channels/index.js";

export const send_message = {
  name: "send_message",
  description: "Send a message via a specific channel.",
  parameters: {
    type: "object",
    properties: {
      channel: {
        type: "string",
        description: "The channel to use (whatsapp, telegram, etc.)",
      },
      to: { type: "string", description: "Recipient ID" },
      message: { type: "string", description: "Message content" },
    },
    required: ["channel", "to", "message"],
  },
  handler: async ({ channel, to, message }) => {
    const channelInstance = channels.getChannel(channel);
    if (!channelInstance)
      return `❌ Channel '${channel}' not found or disabled.`;
    try {
      await channelInstance.sendMessage(to, message);
      return `✅ Message sent via ${channel}`;
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  },
};

export const get_chats_list = {
  name: "get_chats_list",
  description: "Get recent chats for a channel.",
  parameters: {
    type: "object",
    properties: {
      channel: { type: "string", description: "The channel to use" },
    },
    required: ["channel"],
  },
  handler: async ({ channel }) => {
    const channelInstance = channels.getChannel(channel);
    if (!channelInstance) return `❌ Channel '${channel}' not found.`;
    if (!channelInstance.getChats)
      return `❌ Channel '${channel}' does not support fetching chats.`;
    try {
      const chats = await channelInstance.getChats();
      return JSON.stringify(
        chats.map((c) => ({ id: c.id._serialized || c.id, name: c.name })),
        null,
        2,
      );
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  },
};

export const get_chat_messages = {
  name: "get_chat_messages",
  description: "Get message history for a chat.",
  parameters: {
    type: "object",
    properties: {
      channel: { type: "string", description: "The channel to use" },
      chatId: { type: "string", description: "The chat ID" },
      limit: {
        type: "number",
        description: "Number of messages to fetch",
        default: 20,
      },
    },
    required: ["channel", "chatId"],
  },
  handler: async ({ channel, chatId, limit = 20 }) => {
    const channelInstance = channels.getChannel(channel);
    if (!channelInstance) return `❌ Channel '${channel}' not found.`;
    if (!channelInstance.getMessages)
      return `❌ Channel '${channel}' does not support fetching messages.`;
    try {
      const messages = await channelInstance.getMessages(chatId, limit);
      return JSON.stringify(
        messages.map((m) => ({
          from: m.from,
          body: m.body,
          timestamp: m.timestamp,
        })),
        null,
        2,
      );
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  },
};
