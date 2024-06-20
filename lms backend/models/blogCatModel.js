const mongoose = require('mongoose');

let blogCatSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        }
        },
    {
        timestamp: true,
    }
);

module.exports = mongoose.model("BlogCat",blogCatSchema)