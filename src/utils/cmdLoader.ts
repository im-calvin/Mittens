import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import add from "../commands/add.js";
import { getDBStreamers, getGroups } from "../constants.js";
import remove from "../commands/remove.js";
import list from "../commands/list.js";
import schedule from "../commands/schedule.js";

export interface CommandData {
  command: SlashCommandBuilder;
  autoComplete: (interaction: AutocompleteInteraction) => void | Promise<void>;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export const commands: CommandData[] = [add, remove, list, schedule];

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
  const focusedValue = interaction.options.getFocused(true);

  if (focusedValue === undefined || focusedValue.value === "") return;

  let target;
  if (focusedValue.name === "streamer") {
    target = await getDBStreamers();
  } else if (focusedValue.name === "group") {
    target = await getGroups();
  }

  if (target === undefined) return; // the focusedValue was neither streamer nor group

  const filtered = target.filter((t) => t.name.toLowerCase().includes(focusedValue.value));

  const response = filtered
    .map((streamer) => ({
      // streamer can also be "group"
      name: streamer.name,
      value: String(streamer.id), // need to cast or else discord.js complains
    }))
    .slice(0, 25);
  await interaction.respond(response);
}
