const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendResetEmail = async (toEmail, resetLink) => {
  await transporter.sendMail({
    from: `"StudyBuddy Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset Your Account Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetLink}">Reset My Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `
  });
};



const sendFollowEmail = async (toEmail, followerUsername) => {
  await transporter.sendMail({
    from: `"StudyBuddy Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "You have a new follower!",
    html: `
      <h2>New Follower 🎉</h2>
      <p><strong>@${followerUsername}</strong> started following you on StudyBuddy!</p>
      <p>Log in to check out their profile and follow them back.</p>
    `
  });
};

module.exports = {sendResetEmail,
  sendFollowEmail,
}