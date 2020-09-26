"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const timers_1 = require("timers");
class Streamer {
    constructor() {
        this.minToMs = 60000;
    }
    static getInstance() {
        if (!Streamer.instance)
            Streamer.instance = new Streamer();
        return Streamer.instance;
    }
    // eslint-disable-next-line no-unused-vars
    stillHere(reminderCallback) {
        this.setTimeouts(reminderCallback, this.stop);
    }
    // eslint-disable-next-line no-unused-vars
    change(chan, reminderCallback) {
        var _a;
        if (!((_a = process.env.AVAILABLE_CHANNELS) === null || _a === void 0 ? void 0 : _a.split(',').map((c) => Number(c)).includes(chan)))
            return;
        if (chan !== this.channel)
            this.startStream(chan);
        this.setTimeouts(reminderCallback, this.stop);
    }
    startStream(chan) {
        if (this.childProcess)
            this.childProcess.kill();
        const args = ['-re',
            `-i ${process.env.SOURCE_URL}${chan}`,
            '-c copy',
            '-flags +global_header',
            '-bsf:a aac_adtstoasc',
            '-bufsize 3M',
            '-f flv',
            `${process.env.TWITCH_INJEST}${process.env.TWITCH_STREAM_KEY}`];
        this.childProcess = child_process_1.spawn(ffmpeg_static_1.default, args);
    }
    // eslint-disable-next-line no-unused-vars
    setTimeouts(reminderCallback, stopCallback) {
        if (this.reminderTimeout)
            clearTimeout(this.reminderTimeout);
        if (this.stopTimeout)
            clearTimeout(this.stopTimeout);
        this.reminderTimeout = timers_1.setTimeout(reminderCallback, 55 * this.minToMs);
        this.stopTimeout = timers_1.setTimeout(stopCallback, 60 * this.minToMs);
    }
    stop() {
        var _a;
        (_a = this.childProcess) === null || _a === void 0 ? void 0 : _a.kill();
    }
}
exports.default = Streamer;
