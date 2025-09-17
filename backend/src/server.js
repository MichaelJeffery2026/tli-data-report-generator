import express from "express";
import "dotenv/config";
import apiRouter from "./api/api.js";

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use('/api', apiRouter);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend running" });
});

app.listen(port, () => console.log(`Server running on port http://localhost:${port}`));
