import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import add from "../commands/add.js";

export interface CommandData {
  command: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
}

export const commands: CommandData[] = [add];
