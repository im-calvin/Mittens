import { SlashCommandBuilder, PermissionFlagsBits, bold } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { AppDataSource } from "../db/data-source.js";
import { GuildInfo } from "../db/entity/GuildInfo.js";

const guildInfoRepo = AppDataSource.getRepository(GuildInfo);

const command = new SlashCommandBuilder()
  .setName("change-prefix")
  .setDescription("Change the prefix for non-slash commands for your server.")
  .addStringOption((option) =>
    option
      .setMaxLength(1)
      .setMinLength(1)
      .setRequired(true)
      .setName("prefix")
      .setDescription("Prefix to change to")
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

const changePrefix: CommandData = {
  command,
  autoComplete: () => {},
  execute: async (interaction) => {
    // check if the user is an admin in the server
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply(`You need to be an admin to perform this action!`);
      return;
    }

    const guildId = interaction.guildId;
    const prefix = interaction.options.getString("prefix");
    if (!prefix) {
      await interaction.editReply("Prefix was not entered");
      return;
    }

    // not a dm
    if (guildId) {
      const guildInfo = await guildInfoRepo.findOneByOrFail({
        discordGuildId: guildId,
      });
      guildInfo.prefix = prefix;

      await guildInfoRepo.upsert(guildInfo, ["discordGuildId"]);

      await interaction.editReply(`Set prefix for your server to ${bold(guildInfo.prefix)}`);
    }
  },
};

export default changePrefix;
