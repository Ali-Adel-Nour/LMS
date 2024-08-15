const {
  postDocCategory,
  getAllDocsCatgories,
  getSingleDocCategory,
  deleteDocCategory,
  updateDocCategory,
} = require("../controllers/docCatCtrl")
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const docCatRouter = require('express').Router();


docCatRouter.post("/", authMiddleware, isAdmin, rateLimter, postDocCategory);

docCatRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllDocsCatgories);

docCatRouter.get("/:slug", authMiddleware, isAdmin, rateLimter, getSingleDocCategory);

docCatRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateDocCategory);

docCatRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteDocCategory);

module.exports = docCatRouter
