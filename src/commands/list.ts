import { SlashCommandBuilder } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";

const command = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Lists your current subscription list in your current discord channel.");

const list: CommandData = {
  command,
  autoComplete: () => {}, // TODO will this even ever get called since the command isn't registered as autocomplete?
  execute: async (interaction) => {
    const discordUser = await AppDataSource.getRepository(DiscordUser).findOne({
      where: {
        id: interaction.user.id,
      },
    });
    if (!discordUser) {
      await interaction.editReply("You have no subscriptions!");
      return;
    }

    const discordUserSubs = await AppDataSource.getRepository(DiscordUserSubscription).find({
      where: {
        discordUser: discordUser,
        discordChannelId: interaction.channelId,
      },
      relations: ["streamer"],
    });

    if (discordUserSubs.length === 0) {
      await interaction.editReply("You have no subscriptions!");
      return;
    }

    const streamerNames = discordUserSubs.map((sub) => sub.streamer.name);
    await interaction.editReply(`**Your subscriptions:** \n${streamerNames.join("\n")}`);
  },
};

export default list;
