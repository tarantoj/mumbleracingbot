import { ChildProcess, spawn } from 'child_process';
import pathToFfmpeg from 'ffmpeg-static';
import { setTimeout } from 'timers';
import logger from './logger';

export default class Streamer {
  private static instance: Streamer

  private channel?: number;

  private childProcess?: ChildProcess

  private reminderTimeout?: NodeJS.Timeout

  private stopTimeout?: NodeJS.Timeout

  private static minToMs = 60000;

  private static stopTime(): number {
    const mins = Number(process.env.STOP_TIME) ?? 60;
    return mins * Streamer.minToMs;
  }

  private static reminderTime(): number {
    const diff = Number(process.env.REMINDER_DIFFERENCE) ?? 5;
    return Streamer.stopTime() - (diff * Streamer.minToMs);
  }

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

  private async startStream(chan: number) {
    if (this.childProcess && (!this.childProcess?.exitCode || !this.channel)) {
      try {
        await this.stop();
      } catch (error) {
        logger.error(error);
        process.exit();
      }
    }

    this.channel = chan;

    const args = [
      `-loglevel ${process.env.FFMPEG_LOG_LEVEL || 'fatal'}`,
      '-re',
      `-i ${process.env.SOURCE_HOST}/stream/channelnumber/${chan}`,
      '-c copy',
      '-flags +global_header',
      '-bsf:a aac_adtstoasc',
      '-bufsize 3000K',
      '-f flv',
      `${process.env.TWITCH_INJEST}${process.env.TWITCH_STREAM_KEY}`
    ];

    this.childProcess = spawn(pathToFfmpeg, args, { shell: true });

    this.childProcess?.stderr?.on('data', (data) => logger.warn(`ffmpeg: ${data}`));
    this.childProcess?.stdout?.on('data', (data) => logger.info(`ffmpeg: ${data}`));
  }

  // eslint-disable-next-line no-unused-vars
  private setTimeouts(reminderCallback: (...args: any[]) => void, stopCallback: () => void) {
    if (this.reminderTimeout) clearTimeout(this.reminderTimeout);
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    this.reminderTimeout = setTimeout(reminderCallback, Streamer.reminderTime());
    this.stopTimeout = setTimeout(stopCallback, Streamer.stopTime());
  }

  stop(): Promise<void> {
    logger.info('Stopping ffmpeg');
    this.childProcess?.stdin?.write('q');
    return new Promise((resolve, reject) => {
      this.childProcess?.on('exit', () => {
        this.channel = undefined;
        resolve();
      });
      this.childProcess?.on('error', () => {
        if (!this.childProcess?.kill()) reject();
      });
    });
  }
}
