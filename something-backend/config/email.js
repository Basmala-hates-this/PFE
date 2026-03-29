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
    //maybe add link to platform later
  });
};


const sendRoomInviteEmail = async (toEmail, username, roomName, inviterUsername) => {
  await transporter.sendMail({
    from: `"StudyBuddy Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "You've been invited to a private room!",
    html: `
      <h2>Private Room Invite 🏠</h2>
      <p>Hey <strong>@${username}</strong>!</p>
      <p><strong>@${inviterUsername}</strong> has added you to their private room: <strong>${roomName}</strong>.</p>
      <p>Log in to StudyBuddy to access it from your profile.</p>
    `
    //add lonk to platform ...
  });
};

const sendProfessorRejectionEmail = async (toEmail, username, reason) => {
  await transporter.sendMail({
    from: `"StudyBuddy Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Professor Status Request — Update",
    html: `
      <h2>Professor Verification Update</h2>
      <p>Hey <strong>@${username}</strong>,</p>
      <p>Unfortunately, your request for professor status has been <strong>rejected</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>Your account has been set to <strong>student</strong> status.</p>
      <p>If you registered with multiple majors, you will be asked to select one major to continue with on your next login.</p>
      <p>If you believe this is a mistake, please contact the platform administrators.</p>
    `
  });
};

const sendProfessorVerificationEmail = async (toEmail, username) => {
  await transporter.sendMail({
    from: `"StudyBuddy Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Professor Status Has Been Verified! 🎓",
    html: `
      <h2>Professor Status Verified 🎉</h2>
      <p>Hey <strong>@${username}</strong>,</p>
      <p>Great news! Your professor status has been <strong>verified</strong> by our team.</p>
      <p>You now have full access to professor features on StudyBuddy.</p>
      <p>Log in to get started!</p>
    `
  });
};

module.exports = {sendResetEmail,
  sendFollowEmail,
  sendRoomInviteEmail,
  sendProfessorRejectionEmail,
  sendProfessorVerificationEmail,

}