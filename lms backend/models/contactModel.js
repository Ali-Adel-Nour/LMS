const mongoose = require('mongoose');

let contactSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            index: true,
        },
        mobile: {
            type: String,
            required: true,
            unique: true,
        },

        subject: {
            type: String,
            required: true,
        },
        profession: {
            type: String,
            required: true,
        },

        comment: {
            type: String,
            required: true,
        },
        status:{
          type: String,
          default:Submitted,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Contact', reviewSchema);
