# PolloPollo chat-bot

## Dependencies

### Node

To run the chatbot, then it is necessary to have `Node` installed on your system.

The project has been tested on multiple versions of Node, and it is recommened to use Node versions between `8.0` and `10.13`.

### Typescript

Furthermore typescript is required to compile the project to Node compatible JavaScript code.

To install TypeScript run the command `npm install -g typescript` or `yarn global add typescript`

Compiling has been tested with tsc version 4.2.3

### Yarn

To use yarn make sure you have it installed by running the command `npm install --global yarn`

## Build project

The PolloPollo chat-bot project is written in TypeScript and hence compilation is required in order to run the project. Therefore, to run the bot, please use the following steps:

1. Make a file called dbData.json in the root of the project containing mySQL credentials 
2. Run the command `npm install` in the root of the project
3. Run the command `tsc` in the root of the project
4. Run the command `yarn start`/`npm run start` to run the bot

## Deploy project

In order to deploy to chat-bot to the server then please go through the following steps:

1. Clone the repository on the server
2. Navigate to the recently created `chat-bot` folder
3. Make a file called `dbData.json` in the root of the project containing mySQL credentials (see template below)
4. Run the command `npm install` in the root of the project
5. Run the command `tsc` in the root of the project
6. Run `yarn go` or `npm run start` to start the bot
7. Input the password for the chat-bot while it's outputting to the console

## dbData.json template
```json
{
    "host": "your.host.com",
    "user": "username",
    "password": "password",
    "database": "yourDatabase"
}
```

## Stopping the chat-bot
To stop the chat-bot, run `ps aux | grep node`
then note the process id, and run the command `kill -9 <PID>`

## Testnet specifics
If you are running the chat-bot on Obyte Testnet, create a `.env` file in the root of the project
containing only `testnet=1`. Make sure that you haven't tried to run the chat-bot on the main network
if you wish to run it on the testnet, as some configurations will be wrong.

## Logs
Logs for the chat-bot are located in `.pollo_log` in 
`/home/pollopollo/.pollo_log`

## Chat-bot configuration files
The files for the chat-bot configuration can be found in
`/home/pollopollo/.config/chat-bot`
This directory contains the sqlite file `byteball-light.sqlite` if running on Testnet
else the file will be called `byteball.sqlite`
These files contain useful information, such as the chat-bot's wallet addresses, and the autonomous agent address.
These files can be used for troubleshooting, but should remain untouched.

## Further development
To utilize the Obyte developer resources, go to : https://developer.obyte.org

## Monitoring testnet transactions
You can monitor transactions made by the chat-bot on the testnet on https://testnetexplorer.obyte.org

## Architecture of the project

The PolloPollo chat-bot is separated into two main functionalities.

The first part is functionality to respond to requests from Obyte wallets
The second part is a listener that awaits requests on `/bot/*`. 
These requests are validated and will only be processed if they're interacted with from the PolloPollo backend.
