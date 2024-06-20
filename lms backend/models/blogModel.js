const mongoose = require('mongoose');

let blogSchema = new mongoose.Schema(
    {
        title:{
             type: String,
            required:true,
            index: true,
        },
        slug:{
          type: String,
            required:true,
            index: true,
        },

        category: {
          type: String,
          required:true,
        },

        thumbnail: {
          type: String,
            required:true,
            default:
              "https://climate.onep.go.th/mp-content/uploads/2020/01/default-image.jpg",
        },
        video: {
            type: String,
            required:true,
            index: true,
        },
        description: {
            type: String,
            required: true,
        },

        keywords: {
            type: [],
            required: true,
        }
    },
    {
        timestamps: true,
    }
);


module.exports= mongoose.model('Blog', blogSchema);