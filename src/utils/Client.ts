import { Client, ClientOptions, Collection } from "discord.js";
import { readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

export default class MittensClient extends Client {
  commands: Collection<string, string>; // use correct type :)
  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.loadCommands();
  }
  loadCommands() {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const commandsPath = join(__dirname, "commands"); // call this from "src/"
    const commandFiles = readdirSync(commandsPath);
    commandFiles.filter((file) => file.endsWith("ts"));

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = require(filePath);
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ("data" in command && "execute" in command) {
        this.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}
