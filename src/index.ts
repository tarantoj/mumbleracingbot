import * as _ from 'lodash';
import * as tmi from 'tmi.js';
import * as dotenv from 'dotenv';
import Streamer from './streamer';
import logger from './logger';

dotenv.config({ path: '.env' });

process.env.NODE_ENV = process.env.NODE_ENV || 'prod';

const twitchOpts: tmi.Options = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: process.env.CHANNEL_NAMES?.split(','),
};

const client = tmi.Client(twitchOpts);

client.connect()
  .then(() => {
    client.say(process.env.CHANNEL_NAMES?.split(',')[0] || 'mumbleracing', 'bot enabled!');
    logger.info('connected!');
  })
  .catch(logger.error);

const reminderCallback = (channel: string) => {
  logger.info('Reminder triggered');
  client.say(channel, 'Still watching? Send \'!stillhere\' to keep the streaming going for another hour.')
    .then()
    .catch(logger.error);
};

const messageListener = async (channel: string,
  userstate: tmi.ChatUserstate,
  message: String,
  self: boolean) => {
  logger.info(`channel: ${channel}, userstate: ${userstate}, message: ${message}, self: ${self}`);

  if (self) return;
  if (!_.includes(process.env.AUTHORISED_USERS?.split(','), userstate.username?.toLowerCase())) return;

  if (message.startsWith('!switch')) {
    const chanNum = Number(message.split(' ')[1]);
    if (!_.includes(process.env.AVAILABLE_CHANNELS?.split(',').map((c) => Number(c)), chanNum)) return;
    if (process.env.NODE_ENV === 'prod') {
      Streamer.getInstance().change(chanNum, () => reminderCallback(channel));
    }
    logger.info(`Got request to change to ${chanNum}`);
    await client.say(channel, `Changing channel to ${chanNum}`);
  }

  if (message.startsWith('!stillhere')) {
    if (process.env.NODE_ENV === 'prod') Streamer.getInstance().stillHere(() => reminderCallback(channel));
    logger.info('Got request to keep streaming');
    client.say(channel, 'Got it! Will keep streaming for another hour.');
  }

  if (message.startsWith('!stop')) {
    if (process.env.NODE_ENV === 'prod') Streamer.getInstance().stop();
    logger.info('Got request to stop streaming');
    client.say(channel, 'Got it! Will stop streaming.');
  }
};

client.on('message', messageListener);
