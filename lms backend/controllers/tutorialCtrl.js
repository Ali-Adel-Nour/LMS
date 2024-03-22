const Tutorial = require('../models/tutorialModel');

const asyncHandler = require('express-async-handler');

const { default: slugify } = require('slugify');

const postTutorial = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title.toLowerCase());
        }

        if (req.body.tutorialCategory) {
            req.body.tutorialCategorySlug = slugify(
                req.body.tutorialCategory.toLowerCase()
            );
        }

        const postTut = await Tutorial.create(req.body);

        res.status(200).json({
            status: true,
            message: 'Tutorial Created Successfully',postTut
        });
    } catch (error) {
        throw new Error(error);
    }
});

const getATutorial = asyncHandler(async (req, res) => {
    const { slug, type } = req.params;

    try {
        const getATutData = await Tutorial.findOne({
            slug: slug,
            tutorialCategorySlug: type,
        });

        const tutorialTopics = await Tutorial.find({
            tutorialCategorySlug: type,
        })
            .select('topicName title name slug tutorialCategorySlug')
            .sort('createdAt');

        res.status(200).json({
            status: true,
            message: 'Data Fetched Successfully',
            getATutData,tutorialTopics
        });
    } catch (error) {
        throw new Error(error);
    }
});

const getAllTutorials = asyncHandler(async (req, res) => {
    try {
        const allTutorials = await Tutorial.getAllTutorials.find();

        res.status(200).json({
            status: true,
            message: 'All Tutorials Fetched Successfully',
            allTutorials,
        });
    } catch (error) {}
});
module.exports = { postTutorial, getAllTutorials,getATutorial };
