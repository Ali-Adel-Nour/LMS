const TutotrialCategory = require('../models/tutCategory');

const asyncHandler = require('express-async-handler');

const postTutorialCategory = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title.toLowerCase());
        }

        const postTutCat = await TutotrialCategory.create(req.body);
        res.status(200).json({
            status: true,
            message: 'Tutorial Category Created Successfully',
        });
    } catch (error) {
        throw new Error(error);
    }
});

module.exports = {postTutorialCategory}