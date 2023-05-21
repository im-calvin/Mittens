import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import add from "../commands/add.js";
import { getDBStreamers } from "../constants.js";
import remove from "../commands/remove.js";
import list from "../commands/list.js";

export interface CommandData {
  command: SlashCommandBuilder;
  autoComplete: (interaction: AutocompleteInteraction) => void | Promise<void>;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export const commands: CommandData[] = [add, remove, list];

export async function autoCompleteStreamers(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getString("streamer", true).toLowerCase();
  const streamers = await getDBStreamers();
  const filtered = streamers.filter((s) => s.name.toLowerCase().includes(focusedValue));
  const response = filtered
    .map((streamer) => ({
      name: streamer.name,
      value: streamer.id,
    }))
    .slice(0, 25);
  await interaction.respond(response);
}
