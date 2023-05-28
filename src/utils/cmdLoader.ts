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
import { Group } from "src/db/entity/Group.js";
import { Streamer } from "src/db/entity/Streamer.js";

export interface CommandData {
  command: SlashCommandBuilder;
  autoComplete: (interaction: AutocompleteInteraction) => void | Promise<void>;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export const commands: CommandData[] = [add, remove, list, schedule];

export async function autoCompleteStreamers(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getString("streamer", true).toLowerCase();

  if (focusedValue === "") return;

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

declare global {
  interface Array<T> {
    // ES5
    filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[];
    filter<S extends T>(
      predicate: (value: T, index: number, array: T[]) => value is S,
      thisArg?: any
    ): S[];

    // カスタム
    filter<T, U>(
      predicate: (value: T | U, index: number, array: T[]) => unknown,
      thisArg?: any
    ): T[] | U[];
  }
}

export async function autoCompleteStreamersGroups(
  interaction: AutocompleteInteraction
): Promise<void> {
  const focusedValue = interaction.options.getFocused(true);

  if (focusedValue.value === "") return;

  let target: Streamer[] | Group[];
  if (focusedValue.name === "streamer") {
    target = await getDBStreamers();
  } else if (focusedValue.name === "group") {
    target = await getGroups();
  } else {
    return;
  }

  // TODO :D
  const filtered = target.filter<Streamer, Group>((t) =>
    t.name.toLowerCase().includes(focusedValue.value.toLowerCase())
  );

  const response = filtered
    .map((streamer) => ({
      // streamer can also be "group"
      name: streamer.name,
      value: String(streamer.id), // need to cast or else discord.js complains
    }))
    .slice(0, 25);
  await interaction.respond(response);
}
