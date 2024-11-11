const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv').config();
const sendEmail = asyncHandler(async (data) => {
  let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
          user: process.env.MAIL_ID,
          pass: process.env.MAIL_PASS,
      },
  });

  try {
      let info = await transporter.sendMail({
          from: `"Ali" <${process.env.MAIL_ID}>`,
          to: data.to,
          subject: data.subject,
          text: data.text,
          html: data.html,
      });

      console.log("Message sent: ", info.messageId);
      console.log("Preview URL: ", nodemailer.getTestMessageUrl(info) || "Not available");
  } catch (error) {
      console.error("Error sending email:", error);
  }
});
module.exports = sendEmail;