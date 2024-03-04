const TutotrialCategory = require('../models/tutCategory');
const {default: slugify} = require('slugify')
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


const getAllCategory = asyncHandler(async (req, res) => {

    try{
        const alltutcat = await TutotrialCategory.find()
        res.status(200).json({
            status: true,message: 'Tutorial Category Fetched Successfully',alltutcat})


    }catch (error) {
        throw new Error(error);
    }
})

const getATutorial = asyncHandler(async (req, res) => {
    const id = req.params;
try{
    const getatut = await TutotrialCategory.find(id)
    res.status(200).json({
        status: true,message: 'Tutorial Category Fetched Successfully',getatut})


}catch (error) {
    throw new Error(error);
}
})

module.exports = {postTutorialCategory, getAllCategory,getATutorial}