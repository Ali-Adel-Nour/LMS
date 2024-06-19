const {postADoc,
  getAllDocs,
  getSingleDoc,
  deleteADoc,
  updateADoc,} = require("../controllers/documentaionCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const docRouter = require('express').Router();


docRouter.post("/", authMiddleware, isAdmin, postADoc);

docRouter.get("/all", authMiddleware, isAdmin, getAllDocs);

docRouter.get("/:id", authMiddleware, isAdmin, getSingleDoc);


docRouter.put("/:id/edit", authMiddleware, isAdmin, updateADoc);

docRouter.delete("/:id", authMiddleware, isAdmin, deleteADoc);

module.exports = docRouter

