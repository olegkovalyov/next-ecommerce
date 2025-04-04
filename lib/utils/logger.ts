import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, ...rest }) => {

    let logMessage = `[${level}] : ${message}`;
    if (Object.keys(rest).length) {
      logMessage += ` ${JSON.stringify(rest, null, 2)}`;
    }
    return logMessage;
  }),
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
