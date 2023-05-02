import {
  SlashCommandBuilder,
  Interaction,
  ChatInputCommandInteraction,
} from "discord.js";
import { CommandData } from "src/utils/cmdLoader.js";

const add: CommandData = {
  command: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds a user to your subscription list in your current channel."),
  execute: async (interaction) => {
    await interaction.reply("Successfully added a user!");
  },
};

export default add;
