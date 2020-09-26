import winston from 'winston';

export default winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'error',
    }),
  ],
});
