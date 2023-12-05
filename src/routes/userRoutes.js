import express from 'express';
import userController from '../controllers/userController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }).single("image_file");
router.post('/signup', userController.signUp)
router.get('/details', userController.getUserDetails);
router.route('/update-profile').post(upload, userController.updateUserProfile)

export default router;