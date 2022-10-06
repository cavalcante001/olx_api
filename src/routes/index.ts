import { Router, Response, Request } from "express";
import *  as UserController from "../controller/userController";
import *  as AuthController from "../controller/authController";
import *  as AdsController from "../controller/adsController";
import { Auth } from "../middlewares/auth";
import { AuthValidator } from "../validators/AuthValidator";
import { UserValidator } from "../validators/UserValidator";
import multer from 'multer';

const router = Router();

const upload = multer({
    dest: './tmp',
    fileFilter: (req, file, cb) => {
        const allowed: string[] = ['image/jpg', 'image/jpeg', 'image/png'];
        cb(null, allowed.includes(file.mimetype));
    },
    limits: { fieldSize: 2000000 }
})


router.get('/states', UserController.getStates);


router.post('/user/signin', AuthValidator.signin ,AuthController.signin);
router.post('/user/signup', AuthValidator.signup, AuthController.signup);

router.get('/user/me', Auth.private , UserController.info);
router.put('/user/me', [UserValidator.editAction, Auth.private], UserController.editAction);

router.get('/categories', AdsController.getCategories);

router.post('/ad/add', [Auth.private, upload.array('images')], AdsController.add);
router.get('/ad/list', AdsController.getList);
router.get('/ad/item', AdsController.getItem);
router.post('/ad/:id', [Auth.private, upload.array('newImages')], AdsController.editAction);

export default router;