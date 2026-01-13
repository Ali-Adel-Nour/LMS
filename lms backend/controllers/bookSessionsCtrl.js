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

        
        const bookSessions = await BookSession.find({ 
            instructor: id 
        })
        .populate('user', 'firstname lastname email mobile')
        .populate('instructor', 'firstname lastname email mobile profession')
        .sort({ sessionDate: -1 });

        if (!bookSessions || bookSessions.length === 0) {
            return res.status(404).json({ 
                status: false,
                message: 'Book session not found for this instructor' 
            });
        }

        res.status(200).json({
            status: true,
            message: 'Instructor Sessions Fetched Successfully',
            count: bookSessions.length,
            bookSessions
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message || 'Internal Server Error',
        });
    }
});

// Get all sessions for logged-in user
const getMyBookSessions = asyncHandler(async (req, res) => {
    try {
        const bookSessions = await BookSession.find({ 
            user: req.user._id 
        })
        .populate('instructor', 'firstname lastname email mobile profession')
        .sort({ sessionDate: -1 });

        res.status(200).json({
            status: true,
            message: 'Your Book Sessions Fetched Successfully',
            count: bookSessions.length,
            bookSessions
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message || 'Internal Server Error',
        });
    }
});

// Get all sessions for logged-in instructor
const getMyInstructorSessions = asyncHandler(async (req, res) => {
    try {
        const bookSessions = await BookSession.find({ 
            instructor: req.user._id 
        })
        .populate('user', 'firstname lastname email mobile')
        .sort({ sessionDate: -1 });

        res.status(200).json({
            status: true,
            message: 'Your Instructor Sessions Fetched Successfully',
            count: bookSessions.length,
            bookSessions
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message || 'Internal Server Error',
        });
    }
});
const getAvailableTimeSlots = asyncHandler(async (req, res) => {
    const { instructorId, date } = req.query;

    if (!instructorId || !date) {
        return res.status(400).json({
            status: false,
            message: 'instructorId and date are required'
        });
    }

    validateMongodbId(instructorId);

    // Parse the date and create range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find booked sessions for that instructor on that date
    const bookedSessions = await BookSession.find({
        instructor: instructorId,
        sessionDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['Requested', 'Confirmed'] }
    });

    const bookedSlots = bookedSessions.map(session => session.timeslot);


    const allSlots = [
        '09:00 AM - 10:00 AM',
        '10:00 AM - 11:00 AM',
        '11:00 AM - 12:00 PM',
        '01:00 PM - 02:00 PM',
        '02:00 PM - 03:00 PM',
        '03:00 PM - 04:00 PM',
        '04:00 PM - 05:00 PM'
    ];

    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.status(200).json({
        status: true,
        message: 'Available Time Slots Fetched Successfully',
        date,
        instructorId,
        bookedSlots,
        availableSlots
    });
});

module.exports = {
    createBookSession,
    updateBookSession,
    deleteBookSession,
    getBookSession,
    getAllBookSessions,
    getUserBookSession,
    getInstructorSession,
    getMyBookSessions,
    getMyInstructorSessions,
   getAvailableTimeSlots
};