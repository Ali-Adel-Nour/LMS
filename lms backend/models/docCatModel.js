const mongoose = require('mongoose');
let docCatSchema = new mongoose.Schema(
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

module.exports = mongoose.model("DocCat", docCatSchema)