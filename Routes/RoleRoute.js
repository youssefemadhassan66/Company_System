import express from "express";
const router = express.Router();
import { getAllRoles } from "../Controllers/RoleController.js";

router.route("/").get(getAllRoles)


export default router