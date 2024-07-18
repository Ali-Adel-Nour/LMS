const { createContact,getSingleContact,getAllContacts,updateContact,deleteContact} = require('../controllers/contactCtrl');
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const contactRouter = require('express').Router();

contactRouter.post("/", authMiddleware, isAdmin, rateLimter, createContact);

contactRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllContacts);

contactRouter.get("/:id", authMiddleware, isAdmin, rateLimter, getSingleContact);

contactRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateContact);

contactRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteContact);

module.exports = contactRouter
