import express = require("express");

const app = express();
const port = 8004;

app.get("/bot/confirm", (req, res) => {
    res.send("Hello world!");
});

app.get("/createContract", (req, res) => {
    console.log("req");
    res.send(req.accepted);
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
