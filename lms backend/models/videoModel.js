const mongoose = require('mongoose');

let videoSchema = new mongoose.Schema(
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
        video_url: {
            type: String,

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


module.exports= mongoose.model('Video', videoSchema);