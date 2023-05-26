import { Client, ClientOptions, Collection, REST, Routes } from "discord.js";
import { CommandData, commands } from "./cmdLoader.js";
import { readEnv } from "./env.js";

export default class MittensClient extends Client {
  #rest: REST = new REST().setToken(readEnv("DISCORD_TOKEN"));
  commands = new Collection<string, CommandData>();
  messageCache = new Map<string, string>(); // used for translation (user msg id: bot msg id)
  constructor(options: ClientOptions) {
    super(options);
    commands.forEach((c) => this.addToCollection(c));
    this.loadCommands();
  }

  addToCollection(listener: CommandData) {
    this.commands.set(listener.command.name, listener);
  }

  // register all the commands
  async loadCommands() {
    await this.#rest.put(Routes.applicationCommands(readEnv("DISCORD_CLIENT_ID")), {
      body: this.commands.map((c) => c.command.toJSON()),
    });
  }
}
