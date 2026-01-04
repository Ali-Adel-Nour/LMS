const {
  createProject,
  getAllProjects,
  getProject,
  deleteProject,
  updateProject,
} = require("../controllers/projectCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const projectRouter = require('express').Router();


projectRouter.post("/", authMiddleware, isAdmin, rateLimter, createProject);

projectRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllProjects);

projectRouter.get("/:id", authMiddleware, isAdmin, rateLimter, getProject);

projectRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateProject);

projectRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteProject);

module.exports = projectRouter