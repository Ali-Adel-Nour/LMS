const {
  postDocCategory,
  getAllDocsCatgories,
  getSingleDocCategory,
  deleteDocCategory,
  updateDocCategory,
} = require("../controllers/docCatCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const docCatRouter = require('express').Router();


docCatRouter.post("/", authMiddleware, isAdmin, postDocCategory);

docCatRouter.get("/all", authMiddleware, isAdmin,  getAllDocsCatgories);

docCatRouter.get("/:slug", authMiddleware, isAdmin, getSingleDocCategory);


docCatRouter.put("/:id/edit", authMiddleware, isAdmin, updateDocCategory);

docCatRouter.delete("/:id", authMiddleware, isAdmin, deleteDocCategory);

module.exports =  docCatRouter
