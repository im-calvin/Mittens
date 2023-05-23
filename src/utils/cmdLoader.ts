import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import add from "../commands/add.js";
import { getDBStreamers, getGroups } from "../constants.js";
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
  const orgs = await getGroups();

  // if the focusedValue is an org, return all streamers in that org
  if (orgs.map((org) => org.name).includes(focusedValue)) {
    const org = orgs.find((org) => org.name === focusedValue);
    if (org === undefined) {
      throw new Error("Org is undefined, but it was found in the list of orgs");
    }
    const response = org.streamers
      .map((streamer) => ({
        name: streamer.name,
        value: streamer.id,
      }))
      .slice(0, 25);
    await interaction.respond(response);
    return;
  } else if (streamers.map((streamer) => streamer.name.toLowerCase()).includes(focusedValue)) {
    // if the focusedValue is a streamer, return that streamer
    const filtered = streamers.filter((s) => s.name.toLowerCase().includes(focusedValue));
    const response = filtered
      .map((streamer) => ({
        name: streamer.name,
        value: streamer.id,
      }))
      .slice(0, 25);
    await interaction.respond(response);
  }
  throw new Error("No streamer or org found");
}
