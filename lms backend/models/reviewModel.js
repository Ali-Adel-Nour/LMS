const mongoose = require('mongoose');

let reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },

        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        comment: {
            type: String,
            default: 'user',
        },

        color: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model('Review', reviewSchema);