import { Client, ClientOptions, Collection } from "discord.js";
import { readdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

export default class MittensClient extends Client {
  commands: Collection<string, string>; // "add": "src/commands/add"
  constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    this.loadCommands();
  }
  async loadCommands() {
    const commandsPath = join(resolve(), "src", "commands"); // call this from "/"
    const commandFiles = readdirSync(commandsPath);
    commandFiles.filter((file) => file.endsWith("ts"));

    // go through files in commandFiles and activate the commands as long as they have "data" and "execute" (discord.js)
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const fileURL = pathToFileURL(filePath);
      const href = fileURL.href.substring(0, fileURL.href.length - 3);

      console.log(import.meta.url);
      console.log(href);
      const command = await import(href);
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
