const BookSession = require('../models/bookSessionModel');
const asyncHandler = require('express-async-handler');
const { createOne, updateOne, deleteOne, getOne, getAll } = require('./customCtrl');
const validateMongodbId = require('../config/valditeMongodb');

const createBookSession = createOne(BookSession);
const updateBookSession = updateOne(BookSession);
const deleteBookSession = deleteOne(BookSession);
const getBookSession = getOne(BookSession);
const getAllBookSessions = getAll(BookSession);

const getUserBookSession = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        validateMongodbId(id);

        const bookSession = await BookSession.findOne({ 
            _id: id, 
            user: req.user._id 
        });

        if (!bookSession) {
            return res.status(404).json({ 
                status: false,
                message: 'Book session not found for this user' 
            });
        }

        res.status(200).json({
            status: true,
            message: 'Book Session Fetched Successfully',
            bookSession
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message || 'Internal Server Error',
        });
    }
});

const getInstructorSession = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        validateMongodbId(id);

        const bookSession = await BookSession.findOne({ 
            _id: id, 
            instructor: req.user._id 
        });

        if (!bookSession) {
            return res.status(404).json({ 
                status: false,
                message: 'Book session not found for this instructor' 
            });
        }

        res.status(200).json({
            status: true,
            message: 'Instructor Session Fetched Successfully',
            bookSession
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message || 'Internal Server Error',
        });
    }
});

module.exports = {
    createBookSession,
    updateBookSession,
    deleteBookSession,
    getBookSession,
    getAllBookSessions,
    getUserBookSession,
    getInstructorSession
};