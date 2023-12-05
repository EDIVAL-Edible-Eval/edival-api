import express from "express";
import genAIController from "../controllers/genAIController.js";

const router = express.Router();

router.get('/get-recommendations',  genAIController.getListRecommendation)
router.get('/get-procedure', genAIController.getHowToMake)

export default router;