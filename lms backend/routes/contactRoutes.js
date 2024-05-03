const { createContact,getSingleContact,getAllContacts,updateContact,deleteContact} = require('../controllers/contactCtrl');
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const contactRouter = require('express').Router();

contactRouter.post("/", authMiddleware, isAdmin, createContact);

contactRouter.get("/all", authMiddleware, isAdmin, getAllContacts);

contactRouter.get("/:id", authMiddleware, isAdmin, getSingleContact);


contactRouter.put("/:id/edit", authMiddleware, isAdmin, updateContact);

contactRouter.delete("/:id", authMiddleware, isAdmin, deleteContact);

module.exports = contactRouter
