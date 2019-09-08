"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const writeToDataFeed_1 = require("./writeToDataFeed");
async function publishTimestamp() {
    writeToDataFeed_1.writeToDataFeed({ timestamp: Date.now() });
}
exports.publishTimestamp = publishTimestamp;
//# sourceMappingURL=publishTimestamp.js.map