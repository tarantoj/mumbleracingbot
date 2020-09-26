import { ChildProcess, spawn } from 'child_process';
import { SIGINT } from 'constants';
import pathToFfmpeg from 'ffmpeg-static';
import { setTimeout } from 'timers';

export default class Streamer {
  private static instance: Streamer

  private channel?: number;

  private childProcess?: ChildProcess

  private reminderTimeout?: NodeJS.Timeout

  private stopTimeout?: NodeJS.Timeout

  private minToMs = 60000;

  static getInstance(): Streamer {
    if (!Streamer.instance) Streamer.instance = new Streamer();
    return Streamer.instance;
  }

  // eslint-disable-next-line no-unused-vars
  stillHere(reminderCallback: (...args: any[]) => void) {
    this.setTimeouts(reminderCallback, this.stop);
  }

  // eslint-disable-next-line no-unused-vars
  change(chan: number, reminderCallback: (...args: any[]) => void) {
    if (!process.env.AVAILABLE_CHANNELS?.split(',')
      .map((c) => Number(c))
      .includes(chan)) return;
    if (chan !== this.channel) this.startStream(chan);
    this.setTimeouts(reminderCallback, this.stop);
  }

  private startStream(chan: number) {
    if (this.childProcess) this.childProcess.kill(SIGINT);

    const args = ['-re',
      `-i ${process.env.SOURCE_HOST}/stream/channelnumber/${chan}`,
      '-c copy',
      '-flags +global_header',
      '-bsf:a aac_adtstoasc',
      '-bufsize 3000K',
      '-f flv',
      `${process.env.TWITCH_INJEST}${process.env.TWITCH_STREAM_KEY}`];

    this.childProcess = spawn(pathToFfmpeg, args, { shell: true });
    this.childProcess.stdout?.on('data', (data) => console.log(`info: ${data}`));
    this.childProcess.stderr?.on('data', (data) => console.error(`error: ${data}`));
  }

  // eslint-disable-next-line no-unused-vars
  private setTimeouts(reminderCallback: (...args: any[]) => void, stopCallback: () => void) {
    if (this.reminderTimeout) clearTimeout(this.reminderTimeout);
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    this.reminderTimeout = setTimeout(reminderCallback, 55 * this.minToMs);
    this.stopTimeout = setTimeout(stopCallback, 60 * this.minToMs);
  }

  stop() {
    if (this.childProcess) this.childProcess?.kill(SIGINT);
  }
}
