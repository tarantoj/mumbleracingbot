import tmi from 'tmi.js';

const authdUsers = ['mothatt'];

const opts: tmi.Options = {};
const client = tmi.Client(opts);

client.connect().catch(console.error);

const messageListener = (channel: String,
    userstate: tmi.ChatUserstate,
    message: String,
    self: boolean) => {
    if (self) return;
    if (authdUsers.includes(userstate.username))
};

client.on('message', messageListener);
