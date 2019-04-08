import express = require("express");

const app = express();
const port = 8003;

app.get("/bot/confirm", (req, res) => {
    res.send("Hello world!");
});

const server = app.listen(port);

// Ensure express server is properly terminated once the process is killed
function onShutDown() {
    server.close();
}

process.on('SIGTERM', onShutDown);
process.on('SIGINT', onShutDown);