import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Adds a user to your subscription list in your current channel.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply("Successfully added a user!");
}
