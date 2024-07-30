const { postADoc,
  getAllDocs,
  getSingleDoc,
  deleteADoc,
  updateADoc, } = require("../controllers/documentaionCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const docRouter = require('express').Router();


docRouter.post("/", authMiddleware, isAdmin, rateLimter, postADoc);

docRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllDocs);

docRouter.get("/:slug", authMiddleware, isAdmin, rateLimter, getSingleDoc);

docRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateADoc);

docRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteADoc);

module.exports = docRouter

