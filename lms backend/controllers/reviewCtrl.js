const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const asyncHandler = require('express-async-handler');
const validateMongodbId = require('../config/valditeMongodb');

//create Review

const createReview = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try {
        let data = {
            user: _id,
            email: req.body.email,
            comment: req.body.comment,
            color: req.body.color,
            rating: req.body.rating,
        };
        const review = await Review.create(data);
        console.log(review);

        res.status(200).json({
            status: true,
            message: 'Review Created Successfully',
        });
    } catch (error) {
        console.log(error);
    }
});

module.exports = { createReview };
