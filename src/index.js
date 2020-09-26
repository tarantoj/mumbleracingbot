"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const tmi = __importStar(require("tmi.js"));
const dotenv = __importStar(require("dotenv"));
const streamer_1 = __importDefault(require("./streamer"));
const twitchOpts = {
    identity: {
        username: process.env.BOT_USERNAME,
        password: process.env.OAUTH_TOKEN,
    },
    channels: (_a = process.env.CHANNEL_NAMES) === null || _a === void 0 ? void 0 : _a.split(','),
};
const client = tmi.Client(twitchOpts);
dotenv.config();
client.connect().catch();
const reminderCallback = (channel) => {
    client.say(channel, 'Still watching? Send \'!stillhere\' to keep the streaming going for another hour.')
        .then()
        .catch();
};
const messageListener = (channel, userstate, message, self) => {
    var _a, _b;
    if (self)
        return;
    if (!_.includes((_a = process.env.AUTHORISED_USERS) === null || _a === void 0 ? void 0 : _a.split(','), userstate.username))
        return;
    if (message.startsWith('!switch')) {
        const chanNum = Number(message.split(' ')[1]);
        if (!_.includes((_b = process.env.AVAILABLE_CHANNELS) === null || _b === void 0 ? void 0 : _b.split(',').map((c) => Number(c)), chanNum))
            return;
        streamer_1.default.getInstance().change(chanNum, () => reminderCallback(channel));
    }
    if (message.startsWith('!stillhere')) {
        streamer_1.default.getInstance().stillHere(() => reminderCallback(channel));
    }
};
client.on('message', messageListener);
