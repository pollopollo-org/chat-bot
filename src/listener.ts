import bodyParser = require("body-parser");
import express = require("express");
import { state } from "./state";
import { Participant } from "./utils/offerContract";
import { confirmReception } from "./utils/confirmReception";
import { withdrawToParticipant } from "./utils/withdrawToParticipant";

const app = express();
app.use(bodyParser.json());
const port = 8004;

app.post("/postconfirmation", async (req, res) => {
    const id = req.body.applicationId;
    await confirmReception(id);

    res.sendStatus(200);
});

app.post("/withdrawbytes", async (req, res) => {
    const id = req.body.applicationId;
    const wallet = req.body.walletAddress;
    const device = req.body.deviceAddress;

    await withdrawToParticipant(id, { walletAddress: wallet, deviceAddress: device})

    res.sendStatus(200);
});

app.get("/rates", (req, res) => {
    res.send(state.rates);
});

const server = app.listen(port, "localhost");
/**
 * Ensure express server is gracefully terminated once the process is killed
 */
function onShutDown() {
    server.close();
}

process.on("SIGTERM", onShutDown);
process.on("SIGINT", onShutDown);
