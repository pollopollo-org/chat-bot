/*jslint node: true */
"use strict";
exports.port = null;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = true;

exports.storage = 'sqlite';

// TOR is recommended. Uncomment the next two lines to enable it
//exports.socksHost = '127.0.0.1';
//exports.socksPort = 9050;

exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';
exports.deviceName = 'TestPolloPollo.org';
exports.permanent_pairing_secret = '*'; // * allows to pair with any code, the code is passed as 2nd param to the pairing event handler
exports.control_addresses = [
    "0QZMFST5OJ4YS53Z2LMLHW2PVQUI4ZHS3",
    "05KURTND3Z5JJKOS5XSDI32TC7W5HWTZP",
    "0Y3DN63A2J5A4HCUTVEN6BBE5AIUGFZIL",
    "06DWOVWWHCFEU5AHSYCF7UMQOM3HA55HB",
    "07MUDL7KX4BJVPZE6EH2WB6AWZ7MB7X2V",
    "0YOAWXCIQE7K5YXDJBEKQ22VNSBM7YRKT",
    "0JAEPNFYK6QSD3Q73UQ6CYDEMRUQ5T5DW",
    "0K7PG7RU6HBHDB6UK4IVJ5GJCK5Q37JXZ"
];

exports.bIgnoreUnpairRequests = true;
exports.bSingleAddress = false;
exports.bStaticChangeAddress = true;
exports.KEYS_FILENAME = 'keys.json';

// emails
exports.admin_email = '';
exports.from_email = '';

console.log('finished headless conf');
