import * as _ from 'lodash';
import * as tmi from 'tmi.js';
import * as dotenv from 'dotenv';
import Streamer from './streamer';

const twitchOpts: tmi.Options = {};
const client = tmi.Client(twitchOpts);

dotenv.config();

client.connect().catch();

const reminderCallback = (channel: string) => {
  client.say(channel, 'Still watching? Send \'!stillhere\' to keep the streaming going for another hour.')
    .then()
    .catch();
};

const messageListener = (channel: string,
  userstate: tmi.ChatUserstate,
  message: String,
  self: boolean) => {
  if (self) return;
  if (!_.includes(process.env.AUTHORISED_USERS?.split(','), userstate.username)) return;

  if (message.startsWith('!switch')) {
    const chanNum = Number(message.split(' ')[1]);
    if (!_.includes(process.env.AVAILABLE_CHANNELS?.split(',').map((c) => Number(c)), chanNum)) return;
    Streamer.getInstance().change(chanNum, () => reminderCallback(channel));
  }

  if (message.startsWith('!stillhere')) {
    Streamer.getInstance().stillHere(() => reminderCallback(channel));
  }
};

client.on('message', messageListener);
