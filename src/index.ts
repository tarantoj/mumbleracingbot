import * as _ from 'lodash';
import * as tmi from 'tmi.js';
import * as dotenv from 'dotenv';
import * as child_process from 'child_process';

const authdUsers = ['mothatt'];
const availChans = [506, 507]
let ffmpeg: child_process.ChildProcess;

const opts: tmi.Options = {};
const client = tmi.Client(opts);

client.connect().catch(console.error);

const switchChan = (chanNum: Number) => {
  ffmpeg.kill();
  ffmpeg = child_process.spawn('ffmpeg');
};

const messageListener = (channel: String,
  userstate: tmi.ChatUserstate,
  message: String,
  self: boolean) => {
  if (self) return;
  if (!_.includes(authdUsers, userstate.username)) return;

  if (message.startsWith('!switch')) {
    const chanNum = parseInt(message.split(' ')[1], 10);
    if (!_.includes(availChans, chanNum)) return;
    switchChan(chanNum);
  }
};

client.on('message', messageListener);
