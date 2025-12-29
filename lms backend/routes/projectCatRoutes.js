const {
  createProjectCategory,
  getAllProjectCategories,
  getProjectCategory,
  deleteProjectCategory,
  updateProjectCategory,
} = require("../controllers/projectCatCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const projectCatRouter = require('express').Router();


projectCatRouter.post("/", authMiddleware, isAdmin, rateLimter, createProjectCategory);

projectCatRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllProjectCategories);

projectCatRouter.get("/:id", authMiddleware, isAdmin, rateLimter, getProjectCategory);

projectCatRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateProjectCategory);

projectCatRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteProjectCategory);

module.exports = projectCatRouter