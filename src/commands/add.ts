import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
} from "discord.js";

export const addCmd = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Adds a user to your subscription list in your current channel.");

export async function addExecute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("Successfully added a user!");
}
