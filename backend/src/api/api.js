import express from "express";
import surveysRouter from "./surveysRouter.js";

const router = express.Router();

router.use("/surveys", surveysRouter);

export default router;
