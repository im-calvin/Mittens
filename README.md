# Mittens 
[![fork with dotenv-vault](https://badge.dotenv.org/fork.svg?r=1)](https://vault.dotenv.org/project/vlt_a88b4b86e3be377976336d5bc2d9f508d0792bbfd9cce02ce5af9879e452e3ca/example)
[![Docker](https://github.com/im-calvin/Mittens/actions/workflows/docker.yml/badge.svg)](https://github.com/im-calvin/Mittens/actions/workflows/docker.yml)

[Add Mittens here!](https://discord.com/api/oauth2/authorize?client_id=631663182397702146&permissions=414464715840&scope=bot)

If you have an issue or a feature request feel free to reach out to `calv.` on Discord.

This is version 2 of Mittens boasting a 200% speed increase over [version 1 of Mittens](https://github.com/im-calvin/mittens_bot_v1)

## What does Mittens do?

Mittens will monitor your chat for sentences and translates text from Japanese to English when required. In addition, Mittens keeps a schedule of (for now) Hololive streamers to notify you and your friends when someone on your following list goes live!
Mittens uses slash commands with autocomplete. Below is a list of commands supported:
- `add`: adds a streamer to your following list. You will get notifications in the channel you sent the command in
- `remove`: removes a streamer from your following list
- `list`: gets your current subscription list in your current discord channel
- `schedule [streamer], [group], [org]`: gets the scheduled streams (stream reservations) for a particular streamer, group, or organization. See [database](#database) for more info.


## Building & Running

You can either build it locally or use the Docker Hub Image 

### Locally

1. Install required packages with `npm i`

2. Install `SQLite3` following [this documentation](https://www.sqlite.org/download.html)

3. Get a `.env` file by forking the repository and filling it out.

4. Run `npm start`

### Pull and Run with Docker

1. Pull: `docker pull imcalvin/mittens:latest`

2. Fill out the `.env` file on dotenv-vault and acquire a `DOTENV_KEY` for the next step

3. Run: `docker run -d -e DOTENV_KEY=<YOUR_DOTENV_KEY> imcalvin/mittens:latest`

### Building for Docker
First login: `docker login`

Build: `docker build -t mittens .`

Tag: `docker tag mittens imcalvin/mittens:VER_NUM`

Push: `docker push imcalvin/mittens:VER_NUM`

## Database 

The database uses SQLite with TypeORM. Notes on the tables:
- The `languages` table refers to the organization (ex: Hololive) as well as the language (ex: English). 
- The `groups` table is more specific and refers to a specific generation (ex: Hololive English Council)


![Database Diagram](/static/dbdiagram.png)

## CI/CD

![CI/CD Pipeline](/static/CI_CD.jpg)
