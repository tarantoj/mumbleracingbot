import tmi from "tmi.js";
import dotenv from "dotenv";
import { Streamer } from "./streamer";
import { logger } from "./logger";

dotenv.config({ path: ".env" });

process.env.NODE_ENV = process.env.NODE_ENV ?? "prod";

const twitchOpts: tmi.Options = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: process.env.CHANNEL_NAMES?.split(","),
};

const client = tmi.Client(twitchOpts);

client
  .connect()
  .then(() => {
    client.say(
      process.env.CHANNEL_NAMES?.split(",")[0] ?? "mumbleracing",
      "bot connected!"
    );
    logger.info("connected!");
  })
  .catch((reason) => logger.error(`Connect failed with ${reason}`));

const reminderCallback = (channel: string) => {
  logger.info("Reminder triggered");
  client
    .say(
      channel,
      `Still watching? Send \'!stillhere\' to keep the streaming going for another ${
        process.env.STOP_TIME ?? 60
      } mins.`
    )
    .catch((reason) => logger.error(`Reminder say failed with ${reason}`));
};

const availableChannels = process.env.AVAILABLE_CHANNELS?.split(",");
const authorisedUsers = process.env.AUTHORISED_USERS?.split(",");

if (!authorisedUsers) throw new Error("Must supply authorised users");
if (!availableChannels) throw new Error("Must supply available channels");

const messageListener = (
  channel: string,
  userstate: tmi.ChatUserstate,
  message: String,
  self: boolean
) => {
  logger.info(
    `channel: ${channel}, username: ${userstate.username}, message: ${message}, self: ${self}`
  );

  if (self) return;
  if (
    !(
      userstate.username &&
      authorisedUsers.includes(userstate.username?.toLowerCase())
    )
  )
    return;

  const [command, ...args] = message.split(" ");

  if (command[1] !== "!") return;

  if (command === "!switch") {
    const chanNum: string | undefined = args[0];
    if (!availableChannels.includes(chanNum)) return;
    if (process.env.NODE_ENV === "prod") {
      Streamer.getInstance().change(+chanNum, () => reminderCallback(channel));
    }
    logger.info(`Got request to change to ${chanNum}`);
    client.say(channel, `Changing channel to ${chanNum}`);
  }

  if (command === "!stillhere") {
    if (process.env.NODE_ENV === "prod")
      Streamer.getInstance().stillHere(() => reminderCallback(channel));
    logger.info("Got request to keep streaming");
    client.say(
      channel,
      `Got it! Will keep streaming for another ${
        process.env.STOP_TIME ?? 60
      } mins.`
    );
  }

  if (command === "!stop") {
    if (process.env.NODE_ENV === "prod")
      Streamer.getInstance()
        .stop()
        .catch(() => process.exit());
    logger.info("Got request to stop streaming");
    client.say(channel, "Got it! Will stop streaming.");
  }

  if (command === "!chans") {
    logger.info("!chans");
    client.say(channel, availableChannels.join(", "));
  }

  if (command === "!help" || command[0] === "!") {
    logger.info("!help");
    client.say(channel, "!help: Print this message");
    client.say(channel, "!switch <channel>: Switch to channel specified");
    client.say(channel, "!stop: Stop streaming");
    client.say(channel, "!chans: Get a list of available channels");
  }
};

client.on("message", messageListener);
