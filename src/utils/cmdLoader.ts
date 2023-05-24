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

export async function autoCompleteStreamers(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getString("streamer", true).toLowerCase();

  if (focusedValue === undefined || focusedValue === "") return;

  const streamers = await getDBStreamers();
  const filtered = streamers.filter((streamer) =>
    streamer.name.toLowerCase().includes(focusedValue)
  );
  const response = filtered
    .map((streamer) => ({
      name: streamer.name,
      value: streamer.id,
    }))
    .slice(0, 25);
  await interaction.respond(response);
}

export async function autoCompleteStreamersGroups(
  interaction: AutocompleteInteraction
): Promise<void> {
  const focusedValue = interaction.options.getString("streamer", true).toLowerCase();

  if (focusedValue === undefined || focusedValue === "") return;

  const streamers = await getDBStreamers();
  const groups = await getGroups();
  let filtered;

  // if the focusedValue is an org, return all streamers in that org
  if (groups.map((org) => org.name.toLowerCase().includes(focusedValue))) {
    filtered = groups.filter((org) => org.name.includes(focusedValue));
  } else if (streamers.map((streamer) => streamer.name.toLowerCase().includes(focusedValue))) {
    // if the focusedValue is a streamer, return that streamer
    filtered = streamers.filter((s) => s.name.toLowerCase().includes(focusedValue));
  } else {
    throw new Error("No streamer or org found");
  }
  const response = filtered
    .map((streamer) => ({
      // streamer can also be "group"
      name: streamer.name,
      value: streamer.id,
    }))
    .slice(0, 25);
  await interaction.respond(response);
}
