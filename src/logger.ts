import winston from "winston";

export default winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL ?? "error",
    }),
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.prettyPrint(),
    winston.format.simple(),
    winston.format.splat()
  ),
});
