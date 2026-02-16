import express from "express";
const router = express.Router();
import { getAllRoles,getRoleById,CreateRole,UpdateRoleByID,DeleteRoleByID } from "../Controllers/RoleController.js";

router.route("/").get(getAllRoles).post(CreateRole)
router.route("/:id").get(getRoleById).put(UpdateRoleByID).delete(DeleteRoleByID)   

export default router