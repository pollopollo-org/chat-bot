import bodyParser = require("body-parser");
import express = require("express");
import { state } from "./state";
import { aaCancelApplication, aaConfirm, aaCreateApplication, aaDonate, getDonorBalance } from "./utils/aainteraction";
import { confirmReceipt } from "./utils/confirmReceipt";
import { withdrawToParticipant } from "./utils/withdrawToParticipant";

const app = express();
app.use(bodyParser.json());
const port = 8004;

app.post("/postconfirmation", async (req, res) => {
    const id = req.body.applicationId;
    await confirmReceipt(id);

    res.sendStatus(200);
});

app.post("/withdrawbytes", async (req, res) => {
    const id = req.body.applicationId;
    const wallet = req.body.walletAddress;
    const device = req.body.deviceAddress;

    await withdrawToParticipant(id, { walletAddress: wallet, deviceAddress: device});

    res.sendStatus(200);
});

app.get("/rates", (req, res) => {
    res.send(state.rates);
});

app.post("/aacreateapplication", async (req, res) => {
    const producer = req.body.producerWalletAddress;
    const amount = req.body.amountBytes;
    const stablecoin = req.body.isStableCoin;
    await aaCreateApplication(producer, amount, stablecoin, (err, unit) => {
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

app.post("/aaconfirm", async (req, res) => {
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

app.post("/aaGetDonorBalance", async (req, res) => {
    const aaAccount = req.body.aaAccount;
    const balance = await getDonorBalance(aaAccount);
    res.send(balance);
    res.sendStatus(200);
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
