import express from "express";
import surveysRouter from "./surveysRouter.js";
import reportsRouter from "./reportsRouter.js";

const router = express.Router();

router.use("/surveys", surveysRouter);
router.use("/reports", reportsRouter);

export default router;
