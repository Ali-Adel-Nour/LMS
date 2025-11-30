const mongoose = require('mongoose');


const projectCatSchema = new mongoose.Schema( {
    title : {
        type: String,
        required: true,
    },
    slug:{
        type: String,
        required: true,
    },
    
},{ timestamps: true } );



module.exports = mongoose.model("ProjectCat", projectCatSchema);