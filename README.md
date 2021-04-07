# PolloPollo chat-bot

## Dependencies

### Node

To run the chatbot, then it is necessary to have `Node` installed on your system.

The project has been tested on multiple versions of Node, and it is recommened to use Node versions between `8.0` and `10.13`.

### Typescript

Furthermore typescript is required to compile the project to Node compatible JavaScript code.

To install TypeScript run the command `npm install -g typescript` or `yarn global add typescript`

### Yarn

In case you want to use yarn make sure you have it installed by running the command `npm install --global yarn`

## Build project

The PolloPollo chat-bot project is written in TypeScript and hence compilation is required in order to run the project. Therefore, to run the bot, please use the following steps:

1. Make a file called dbData.json in the root of the project containing mySQL credentials 
2. Run the command `npm install` in the root of the project
3. Run the command `tsc` in the root of the project
4. Run the command `yarn start`/`npm run start` to run the bot

## Deploy project

In order to deploy to chat-bot to the server then please go through the following steps:

1. make a file called dbData.json in the root of the project containing mySQL credentials
2. Run the command `npm install` int the root of the project`
3. Run the command `tsc` locally in the root of the project
4. Upload all files in the project to the a new folder called `chat-bot` *except* the folder `node_modules` and `conf.js` 
6. Run `npm install` on the server within the `chat-bot` folder
7. Run the command `npm run start` to start the bot

## Architecture of the project

The PolloPollo chat-bot is separated into two main functionalities.

The first part is functionality to respond to requests from Obyte wallets
The second part is a listener that awaits requests on `/bot/*`. 
These requests are validated and will only be processed if they're interacted with from the PolloPollo backend.
