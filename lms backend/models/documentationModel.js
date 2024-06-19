const mongoose = require('mongoose');

let docSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        slug: { type: String, required: true },

        type: {
          type: String,
          required: true,
        },

        author: {
            type: String,

            default: 'Ali Nour Al Din',
        },

        content: {
            type: String,
            required: true,
        },

        keywords: { type: String,
           required: true
        },


    doc_image: {

      type : String,
      default:
        "https://climate.onep.go.th/mp-content/uploads/2020/01/default-image.jpg",
    },
  },
    {
        timestamp: true,
    }
);

module.exports = mongoose.model("Documentation",docSchema)