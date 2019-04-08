# PolloPollo chat-bot

## Dependencies

### Node

To run the chatbot, then it is necessary to have `Node` installed on your system.

The project has only been tested on recent versions of Node, and hence it is recommened to use Node `>= 8.0`.

### Typescript

Furthermore typescript is required to compile the project to Node compatible JavaScript code.

To install TypeScript run the command `npm install -g typescript` or `yarn global add typescript`

## Build project

The PolloPollo chat-bot project is written in TypeScript and hence compilation is required in order to run the project. Therefore, to run the bot, please use the following steps:

1. Run the command `tsc` in the root of the project
2. Run the command `yarn initialize` to run the bot

## Architecture of the project

The PolloPollo chat-bot is separated into two main functionalities. 

The first part is functionality to respond to requests from Obyte wallets, and the second part is a listener that awaits requests on `/bot/*`. These requests are validated and will only be processed if they're interacted with from the PolloPollo backend.