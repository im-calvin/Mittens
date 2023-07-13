import { SlashCommandBuilder, PermissionFlagsBits, bold } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { AppDataSource } from "../db/data-source.js";
import { GuildTranslate } from "../db/entity/GuildTranslate.js";

const guildTranslateRepo = AppDataSource.getRepository(GuildTranslate);

const command = new SlashCommandBuilder()
  .setName("translate-status")
  .setDescription(
    "Check to see if Mittens is actively translating from Japanese to English for your server."
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const translateStatus: CommandData = {
  command,
  autoComplete: () => {},
  execute: async (interaction) => {
    // make sure that it's not a dm
    if (interaction.guildId) {
      // check if the user is an admin in the server
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.editReply(`You need to be an admin to perform this action!`);
        return;
      }

      const guildTranslate = await guildTranslateRepo.findOneByOrFail({
        discordGuildId: interaction.guildId,
      });

      await interaction.editReply(
        // need to convert from integer (0, 1) to bool to string
        `Japanese to English translation is set to ${bold(String(Boolean(guildTranslate.status)))}`
      );
    }
  },
};

export default translateStatus;
