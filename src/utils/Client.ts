import {
  Client,
  ClientOptions,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { commands } from "./cmdLoader.js";

interface command {
  data: SlashCommandBuilder;
  execute: Function;
}

export default class MittensClient extends Client {
  /* "add": Object {data: SlashCommand, execute: function} */
  #rest: REST = new REST().setToken(process.env.DISCORD_TOKEN as string);
  constructor(options: ClientOptions) {
    super(options);
    this.loadCommands();
  }
  async loadCommands() {
    // register all the commands
    
    
    await this.#rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as string),
      { body: commands }
    );

  }
}
