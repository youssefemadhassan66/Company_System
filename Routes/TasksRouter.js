import express from "express";
import { protection , restrictedTo } from "../Middleware/AuthMiddelware.js";
import { getAllTasks,createNewTask,getTaskById,UpdateTaskByID,DeleteTaskByID } from "../Controllers/TaskController.js";
const router = express.Router();

router.route("/")
    .get(getAllTasks)
    .post(createNewTask);

router.route("/:id")
    .get(getTaskById)
    .put(UpdateTaskByID)
    .delete(DeleteTaskByID);

export default router
