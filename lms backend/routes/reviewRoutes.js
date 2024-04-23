const { createReview,getSingleReview,getAllReviews,updateReview,deleteReview} = require('../controllers/reviewCtrl');
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const reviewRouter = require('express').Router();

reviewRouter.post("/", authMiddleware, isAdmin, createReview);

reviewRouter.get("/all", authMiddleware, isAdmin, getAllReviews);

reviewRouter.get("/:id", authMiddleware, isAdmin, getSingleReview);


reviewRouter.put("/:id/edit", authMiddleware, isAdmin, updateReview);

reviewRouter.delete("/:id", authMiddleware, isAdmin, deleteReview);








reviewRouter.put("/update/:id", authMiddleware, isAdmin, updateReview);


module.exports = reviewRouter;