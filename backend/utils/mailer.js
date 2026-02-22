const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'gmail', // mund të ndryshosh në varësi të email provider-it
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    })
    console.log('Email sent: ', info.response)
    return true
  } catch (error) {
    console.error('Error sending email: ', error)
    return false
  }
}

module.exports = sendMail
