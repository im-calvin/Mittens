import { SlashCommandBuilder, PermissionFlagsBits, bold } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { AppDataSource } from "../db/data-source.js";
import { GuildTranslate } from "../db/entity/GuildTranslate.js";

const guildTranslateRepo = AppDataSource.getRepository(GuildTranslate);

const command = new SlashCommandBuilder()
  .setName("toggle-translate")
  .setDescription("Toggle auto-translation from Japanese to English for your server.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const toggleTranslate: CommandData = {
  command,
  autoComplete: () => {},
  execute: async (interaction) => {
    // check if the user is an admin in the server
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply(`You need to be an admin to perform this action!`);
      return;
    }

    const guildId = interaction.guildId;
    // not a dm
    if (guildId) {
      const guildTranslate = await guildTranslateRepo.findOneByOrFail({
        discordGuildId: guildId,
      });
      guildTranslate.status = !guildTranslate.status;

      await guildTranslateRepo.upsert(guildTranslate, ["discordGuildId"]);

      await interaction.editReply(
        // need to convert from integer (0, 1) to bool to string
        `Set Japanese to English translation to ${bold(String(Boolean(guildTranslate.status)))}`
      );
    }
  },
};

export default toggleTranslate;
