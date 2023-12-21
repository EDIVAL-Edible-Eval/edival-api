import express from "express";
import sendNotifController from "../controllers/sendNotifController.js";

const router = express.Router();

router.get('/notif-reminder-all-user',  sendNotifController.notifAllReminders)

export default router;