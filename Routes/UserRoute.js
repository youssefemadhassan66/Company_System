import express from "express";
const router = express.Router();
import {   
    restrictedTo,
    protection,
 } from "../Middleware/AuthMiddelware.js";

import {getMe,getUSerById,getAllUsers, deleteUserByID,ToggleActivateUSer} from "../Controllers/UserController.js";

// router.use(protection)

router.get("/getMe/", getMe,getUSerById);

// router.use(restrictedTo(["admin , owner"]))

router.route("/")
.get(getAllUsers)

router.route("/:id")
.get(getUSerById)
.delete(deleteUserByID)

router.route("/:id/active").get(ToggleActivateUSer)

export default router;

