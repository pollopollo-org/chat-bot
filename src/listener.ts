import express = require("express");

const app = express();
const port = 8002;

app.get("/bot/confirm", (req, res) => {
    res.send("Hello world!");
});

app.listen(port);