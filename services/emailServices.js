const nodemailer = require('nodemailer');

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Generic function to send an email
 */
const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} with subject: "${subject}"`);
  } catch (error) {
    console.error('Error sending email:', error.message, error.stack);
    throw error;
  }
};

/**
 * Send login alert email for e-commerce platform
 */
const sendLoginEmail = async (username, email) => {
  const message = `Hello ${username},\n\nYou have successfully logged into your account on our E-Commerce Platform.\nE-Commerce Team`;

  await sendEmail(email, 'Login Alert - E-Commerce Platform', message);
};

module.exports = {
  sendEmail,
  sendLoginEmail
};