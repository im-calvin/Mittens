import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
} from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds a user to your subscription list in your current channel."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Successfully added a user!");
  },
};
