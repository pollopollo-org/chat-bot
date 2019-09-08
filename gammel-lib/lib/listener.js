"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express = require("express");
const state_1 = require("./state");
const confirmReception_1 = require("./utils/confirmReception");
const app = express();
app.use(bodyParser.json());
const port = 8004;
app.post("/postconfirmation", async (req, res) => {
    const id = req.body.applicationId;
    await confirmReception_1.confirmReception(id);
    res.sendStatus(200);
});
app.get("/rates", (req, res) => {
    res.send(state_1.state.rates);
});
const server = app.listen(port, "localhost");
function onShutDown() {
    server.close();
}
process.on("SIGTERM", onShutDown);
process.on("SIGINT", onShutDown);
//# sourceMappingURL=listener.js.map