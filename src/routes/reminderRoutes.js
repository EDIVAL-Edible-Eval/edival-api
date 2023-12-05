import express from "express";
import reminderController from "../controllers/reminderController.js";
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }).single("image_file");

router.route('/add-reminder').post(upload, reminderController.addReminder)
router.delete('/delete-reminder', reminderController.deleteReminder)
router.route('/update-reminder').post(upload, reminderController.updateReminder)

export default router;