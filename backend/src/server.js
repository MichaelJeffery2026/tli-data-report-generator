import express from "express";
import "dotenv/config";
import apiRouter from "./api/api.js";
import logger from "./utils/logger.js"

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const msg = `${req.method} ${req.originalUrl} ${res.statusCode === 304 ? 200 : res.statusCode} ${duration}ms`;
        if (res.statusCode >= 500) logger.error(msg);
        else if (res.statusCode >= 400) logger.warn(msg);
        else logger.http(msg);
    });
    next();
});

app.use('/api', apiRouter);

app.use((err, _req, res, _next) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(err.status || 500).json({ error: err.message });
});

app.listen(port, () => logger.info(`Server running on port http://localhost:${port}`));
