import express from "express";
import genAIController from "../controllers/genAIController.js";

const router = express.Router();

router.post('/get-recommendations',  genAIController.getListRecommendation)
router.post('/get-procedure', genAIController.getHowToMake)

export default router;