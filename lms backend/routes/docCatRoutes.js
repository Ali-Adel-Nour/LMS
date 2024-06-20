const {
  postDocCategory,
  getAllDocsCategories,
  getSingleDocCategory,
  deleteDocCategory,
  updateDocCategory,
} = require("../controllers/documentaionCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const docCatRouter = require('express').Router();


docRouter.post("/", authMiddleware, isAdmin, postDocCategory);

docRouter.get("/all", authMiddleware, isAdmin,  getAllDocsCategories);

docRouter.get("/:slug", authMiddleware, isAdmin, getSingleDocCategory);


docRouter.put("/:id/edit", authMiddleware, isAdmin, updateDocCategory);

docRouter.delete("/:id", authMiddleware, isAdmin, deleteDocCategory);

module.exports =  docCatRouter
