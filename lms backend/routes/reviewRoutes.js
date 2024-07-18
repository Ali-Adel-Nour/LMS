const { createReview,getSingleReview,getAllReviews,updateReview,deleteReview} = require('../controllers/reviewCtrl');
const { isAdmin, authMiddleware } = require('../middleware/authMiddleware');
const rateLimter = require("../middleware/rateLimiter")
const reviewRouter = require('express').Router();
reviewRouter.post("/", authMiddleware, isAdmin, rateLimter, createReview);

reviewRouter.get("/all", authMiddleware, isAdmin, rateLimter, getAllReviews);

reviewRouter.get("/:id", authMiddleware, isAdmin, rateLimter, getSingleReview);

reviewRouter.put("/:id/edit", authMiddleware, isAdmin, rateLimter, updateReview);

reviewRouter.delete("/:id", authMiddleware, isAdmin, rateLimter, deleteReview);









reviewRouter.put("/update/:id", authMiddleware, isAdmin, updateReview);


module.exports = reviewRouter;