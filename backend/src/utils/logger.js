import winston from "winston";

const { combine, colorize, timestamp, printf } = winston.format;

// Define a custom log format
// Example output: "2025-09-16 19:26:42 [info]: Server running on port http://localhost:3000"
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
    // Common levels: error, warn, info, http, verbose, debug, silly
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        new winston.transports.Console()
        // new winston.transports.File({ filename: "logs/error.log", level: "error" })
        // new winston.transports.File({ filename: "logs/combined.log" })
    ]
});

export default logger;
