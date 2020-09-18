import bodyParser = require("body-parser");
import express = require("express");
import { state } from "./state";
import { Participant } from "./utils/offerContract";
import { confirmReception } from "./utils/confirmReception";
import { withdrawToParticipant } from "./utils/withdrawToParticipant";
import { aaCancelApplication, aaConfirm, aaCreateApplication, aaDonate } from "./utils/aainteraction";

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

app.post("/createapplication", async (req, res) => {
    const producer = req.body.producer;
    const amount = req.body.amount;
    const stablecoin = req.body.stablecoin;
    await aaCreateApplication(producer,amount,stablecoin, (err, unit) => {
        if (err) {
            res.send(err);
            res.sendStatus(500);
        } else {
            res.send(unit);
            res.sendStatus(200);
        }
    });
});

app.post("/aacancelapplication", async (req, res) => {
    const applicationId = req.body.applicationId;
    await aaCancelApplication(applicationId, (err, unit) => {
        if (err) {
            res.send(err);
            res.sendStatus(500);
        } else {
            res.send(unit);
            res.sendStatus(200);
        }
    });
});

app.post("/donate", async (req, res) => {
    const applicationId = req.body.applicationId;
    const donor = req.body.donor;
    await aaDonate(applicationId, donor, (err, unit) => {
        if (err) {
            res.send(err);
            res.sendStatus(500);
        } else {
            res.send(unit);
            res.sendStatus(200);
        }
    });
});

app.post("aaConfirm/", async (req, res) => {
    const applicationId = req.body.applicationId;
    await aaConfirm(applicationId, (err, unit) => {
        if (err) {
            res.send(err);
            res.sendStatus(500);
        } else {
            res.send(unit);
            res.sendStatus(200);
        }
    });
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
