![Logo](https://i.imgur.com/i6z6oDw.png)

<h1 align="center">botBob</h1>
<h4 align="center">A Multifunctional Discord Bot</h4>

<p align="center">
   <a href="https://github.com/wilzzu/botBob/releases/latest">
       <img src="https://img.shields.io/github/v/release/wilzzu/botBob?style=flat-square&labelColor=black&color=blue&label=Latest%20Release" alt="Latest release">
   </a>
   <a href="https://hub.docker.com/r/wilzzu/botbob">
       <img src="https://img.shields.io/badge/Docker%20Hub-botBob-blue?style=flat-square&labelColor=black&color=blue&label=Docker%20Hub&logo=docker&logoColor=white" alt="Docker Hub">
   </a>
  <a href="https://nodejs.org/">
     <img src="https://img.shields.io/badge/Node.js-%3E=16.11.0-green?style=for-the-badge&logo=node.js&logoColor=white&style=for-the-badge&labelColor=black&color=green&label=Node.js" alt="node.js">
  </a>
  <a href="https://discord.js.org/">
     <img src="https://img.shields.io/badge/Discord.js-14.14.1-blue?style=flat-square&labelColor=black&color=blue&label=Discord.js&logo=discord&logoColor=white" alt="discord.js">
  </a>
  <a href="https://choosealicense.com/licenses/mit/">
     <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&labelColor=black&color=blue&label=License" alt="License">
  </a>
</p>

## About

botBob is an advanced Discord bot built with the latest Discord.js version (v14)! It includes modular commands, AI integration and unique functionalities, like timeout voting and debt tracking. botBob was designed from the ground up to be fully customizable, enabling the user to edit every command, every string, and every value through the configs. The bot is built primarily for our private Discord server, but feel free to use it if any of the features sound useful to you!

## Features

- Vote Timeout
- Debt Tracking
- Custom User Responses
- Respond to Specific Words
- Rare Messages
- AI integration using OpenAI through Rapid API
- Fully Customizable Commands
- Multilingual Support

## Setup

### Requirements

- [Node](https://nodejs.org/) - `v16.11.0` or higher
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (optional)

### Create a new Discord bot

1. Go to https://discord.com/developers/applications and create a new application

2. Select the `Bot` tab and enable `SERVER MEMBERS INTENT` and `MESSAGE CONTENT INTENT`

   ![Privileged Gateway Intents](https://i.imgur.com/oCmzfMx.png)

3. Navigate to `OAuth2 -> URL Generator`. Under `SCOPES` enable `bot` and under `BOT PERMISSIONS` enable `Administrator`

   ![Scopes and Permissions](https://i.imgur.com/aicSS1I.png)

4. On the bottom of the `URL Generator` page you should see an invite link. Copy & paste it in your browser's search bar and invite the bot to your server

   ![Invite link](https://i.imgur.com/MuAAB8r.png)

### Normal installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Wilzzu/botBob.git
   cd botBob
   ```

   or download the [latest version](https://github.com/wilzzu/botBob/releases/latest).

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configuration:**

   - Rename the `example.env` file to `.env` and fill in the [environment variables](#environment-variables).
   - Rename the database files found in `/databases` folder from `[name].example.json` to `[name].json`.
   - Rename the config files found in `/configs` folder from `[name].example.json` to `[name].json`. Follow the instructions in [Optional configuration](#optional-configuration) if you want to make any changes.

4. **Deploy commands and run the bot:**
   ```bash
   npm run commands
   npm run start
   ```

### Docker installation

1. Either install the latest stable version:

   ```bash
   docker pull wilzzu/botbob
   ```

   or [customize](#optional-configuration) it first and build using:

   ```bash
   docker build --tag botbob .
   ```

2. Start the bot using `docker run` with your [environment variables](#environment-variables):

   ```
   docker run -d wilzzu/botbob \
      -e DISCORD_TOKEN=<YOUR_BOT_TOKEN> \
      -e DISCORD_CLIENT_ID=<YOUR_CLIENT_ID> \
      -e RAPID_API_KEY=<YOUR_RAPID_API_KEY> \
      -e MONGO_URI=<YOUR_MONGO_URI>
   ```

   or use `--env-file` to point to the path you stored your `.env` file. You can find more info [here](https://docs.docker.com/engine/reference/commandline/container_run/#env).

View the Docker image on [Docker Hub](https://hub.docker.com/r/wilzzu/botbob).

### Environment Variables

| Name            | Required | Description      |
| --------------- | -------- | ---------------- |
| `DISCORD_TOKEN` | `true`   | Log into the bot |

You can find the bot's token under the `Bot` tab in the [Discord Developer Portal](https://discord.com/developers/applications). Click on `Reset Token` to generate a new token.

![Discord token](https://i.imgur.com/ii1hkUQ.png)

---

| Name                | Required | Description           |
| ------------------- | -------- | --------------------- |
| `DISCORD_CLIENT_ID` | `true`   | Deploy slash commands |

You can find the bot's Client ID under the `OAuth2 -> General` tab in the [Discord Developer Portal](https://discord.com/developers/applications).

---

| Name            | Required | Description    |
| --------------- | -------- | -------------- |
| `RAPID_API_KEY` | `false`  | AI integration |

For this project, I used the [OPEN AI by InfinitiSync](https://rapidapi.com/InfinitiSync/api/open-ai25) API. You can try using other AI API's found on [Rapid API](https://rapidapi.com/), but they are not guaranteed to work with the bot. To get the API key, subscribe to the API and copy the `X-RapidAPI-Key`.

![Rapid API key](https://i.imgur.com/C4aPJww.png)

---

| Name        | Required | Description      |
| ----------- | -------- | ---------------- |
| `MONGO_URI` | `false`  | Timeout database |

To keep track of how many times a user has been timed out, you will need to create a new database in MongoDB. [Here's a tutorial](https://www.mongodb.com/basics/create-database) to get you started. Once created, click on `Connect -> MongoDB for VS Code` and copy the URI. Lastly replace the `<password>` part with your password.

![MongoDB URI](https://i.imgur.com/HEe9KdG.png)

## Optional configuration

You can fully customize every aspect of botBob by modifying the config files found in `/configs` folder. If you are using Docker to run the bot, edit the `[name].example.json` files, otherwise first rename those files to `[name].json` and then edit them.

- `config.json` file contains all the options, such as:

  - Selected language and prefix
  - Guild and channel ID's
  - Admin ID's
  - Timeout lengths and vote durations
  - Custom responses and rare messages
  - Rapid API URL and host

- `languages.json` file contains every string the bot uses and their translations:
  - Languages
  - Command names and descriptions
  - Activities
  - AI Prompt
  - Error messages

### Enabling features

- To enable MongoDB, set the `useMongoDB` field to `true` in `config.json`.
- To enable Rapid API AI integration, set the `aiResponses` field to `true` in `config.json`.

> [!IMPORTANT]
> When enabling these features, make sure their [environment variables](#environment-variables) are set in the `.env` file or are passed to `docker run`.

### Custom languages

Create your own translations by copying a pre-existing language object in `languages.json` file, renaming it and changing the strings to suit your preferences. Then change the selected language in `config.json` file to your newly created one and run `npm run commands` or rebuild if using Docker.

## Commands

| Command    | Options              | Description                      |
| ---------- | -------------------- | -------------------------------- |
| `/setup`   | `null`               | Setup channels                   |
| `/timeout` | `@user`              | Vote a user to be timed out      |
| `/debt`    | `@from @to <amount>` | Add debt to a user               |
| `/admin`   | `@user`              | Give admin permissions to a user |

### Modular commands

You can disable unneeded commands by deleting their command files at `/commands/utility/[command].js` and running `npm run commands`, or rebuilding if using Docker.

## Deprecated features

I've been developing botBob since 2019, and over the years, several features were implemented that have since been deprecated. You can find the code for these features under the [`/deprecated`](https://github.com/Wilzzu/botBob/tree/main/deprecated) folder. I've included them to be transparent and show how the code quality and design have evolved over the course of this project.\
Feel free to check out these details and screenshots showing how the features used to look when they were still in use:

<details>
  <summary>Show Details & Screenshots</summary>

### Weather News (2023)

2023 was extraordinary hot, so I made a script that would send all the news articles that had anything to do with the weather. I scraped the info from one news site and the other had a dedicated API. The script ran until summer was over.

![Weather News](https://i.imgur.com/vMUX3Pv.png)

### foodBot (2022)

![foodBot website](https://i.imgur.com/mWFJlAD.jpeg)

Users could share their food pictures with each other on the server. Each submission would show up on a website which had a map of all the posts. Other users could like and comment on the post and check all the other posts on the map.\
Submitting a food post was done via a slash command, which made the bot send the user a direct message with instructions:

1. First the user had to select their coordinates, which was done via the same website. The user could move a pin on the map and select where they were at, or user their phone's GPS to select it automatically for them.
   ![foodBot coordinates](https://i.imgur.com/CJ8dDxH.png)

2. Then they had to send the coordinates to the bot, which would show a confirmation message of the selected location. Finally the user had to send a picture of their food, give it a rating and confirm the post.
   ![foodBot post](https://i.imgur.com/N2vLhMy.png)

3. After submitting a post, it would show up on the main server. Other users could then like, comment and check out the post on the map website.

   ![foodBot final](https://i.imgur.com/QZIDtfg.png)

### tjBot (2022)

One of our users went to the compulsory military service here in Finland. It is a tradition to count how many days are left of your service, and each day would represent a Pokémon. I also added other stats:

- Today's weather at his service location
- Money made during the service
- His and his peers' swimming achievements
- Pokémon and Digimon

The bot would then send a message with these stats everyday at 6 AM until his service was over.

![tjBot](https://i.imgur.com/yRBwsE7.png)

(botBob is not affiliated with the creators of Pokémon or Digimon. All the trademarks are property of their respective owners.)

### CS:GO Match Alerts (2020)

Our Discord server got into CS:GO during the COVID-19 outbreak, so I built a bot that would send an alert when a new professional match was starting. It would list all the important stats of the match, and update the selected maps in real time when the teams were selecting them. The main livestream and a Finnish livestream were linked below the alert, as well as the HLTV match page.

![CSGO Alerts](https://i.imgur.com/9ih7kuH.png)

</details>

## License

This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) license.
