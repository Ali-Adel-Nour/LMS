const mongoose = require('mongoose');

let blogCatSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
        },
        slug : {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("BlogCat", blogCatSchema)