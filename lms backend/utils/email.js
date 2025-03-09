const nodemailer = require('nodemailer')

 require('dotenv').config();

const sendEmail =async(option)=>{

  const transporter = nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });



const emailOptions = {
  from:'CodexTech.com',
  to: option.email,
  subject: option.subject,
  text:option.message
}

try {
  const info = await transporter.sendMail(emailOptions);
  console.log('Email sent:', info.response);
} catch (err) {
  console.error('Error sending email:', err);
}
}

module.exports = sendEmail