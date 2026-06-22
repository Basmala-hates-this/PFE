// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   family: 4,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// const sendResetEmail = async (toEmail, resetLink) => {
//   await transporter.sendMail({
//     from: `"Glaukopis Platform" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Reset Your Account Password",
//     html: `
//       <h2>Password Reset Request</h2>
//       <p>You requested a password reset. Click the link below:</p>
//       <a href="${resetLink}">Reset My Password</a>
//       <p>This link expires in 15 minutes.</p>
//       <p>If you didn't request this, just ignore this email.</p>
//       <p>Have a happy life :)</p>
//     `
    
//   });
// };


// const sendOtpEmail = async (email, otp) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your Glaukopis Verification Code',
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 30px; border-radius: 12px; background-color: #f0f4ff;">
//         <h2 style="color: #3b5bdb;">Verify Your Email</h2>
//         <p>Use the code below to verify your email address. You have <strong>10 minutes</strong> in hand.</p>
//         <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #3b5bdb; margin: 20px 0;">
//           ${otp}
//         </div>
//         <p style="color: #888;">If you didn't request this, just ignore this email.</p>
//         <p>Have a happy life :)</p>
//       </div>
//     `
//   });
// };



// const sendFollowEmail = async (toEmail, followerUsername) => {
//   await transporter.sendMail({
//     from: `"Glaukopis Platform" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "You have a new follower!",
//     html: `
//       <h2>New Follower 🎉</h2>
//       <p><strong>@${followerUsername}</strong> started following you on Glaukopis!</p>
//       <p>Log in to check out their profile and follow them back.</p>
//       <p>Might as well check some other things here....</p>
//     `
//     //maybe add link to platform later
//   });
// };


// const sendRoomInviteEmail = async (toEmail, username, roomName, inviterUsername) => {
//   await transporter.sendMail({
//     from: `"Glaukopis Platform" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "You've been invited to a private room!",
//     html: `
//       <h2>Private Room Invite 🏠</h2>
//       <p>Hey <strong>@${username}</strong>!</p>
//       <p><strong>@${inviterUsername}</strong> has added you to their private room: <strong>${roomName}</strong>.</p>
//       <p>Log in to Glaukopis to access it from your profile.</p>
//       <p>Have a happy life :)</p>
//     `
//     //add lonk to platform ...
//   });
// };

// const sendProfessorRejectionEmail = async (toEmail, username, reason) => {
//   await transporter.sendMail({
//     from: `"Glaukopis Platform" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Your Professor Status Request — Update",
//     html: `
//       <h2>Professor Verification Update</h2>
//       <p>Hey <strong>@${username}</strong>,</p>
//       <p>Unfortunately, your request for professor status has been <strong>rejected</strong>.</p>
//       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
//       <p>Your account has been set to <strong>student</strong> status.</p>
//       <p>If you registered with multiple majors, you will be asked to select one major to continue with on your next login.</p>
//       <p>If you believe this is a mistake, please contact the platform administrators.</p>
//       <p>Better luck next time mate....</p>
//     `
//   });
// };

// const sendProfessorVerificationEmail = async (toEmail, username) => {
//   await transporter.sendMail({
//     from: `"Glaukopis Platform" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Your Professor Status Has Been Verified! 🎓",
//     html: `
//       <h2>Professor Status Verified 🎉</h2>
//       <p>Hey <strong>@${username}</strong>,</p>
//       <p>Great news! Your professor status has been <strong>verified</strong> by our team.</p>
//       <p>You now have full access to professor features on Glaukopis.</p>
//       <p>Log in to get started!</p>
//       <p>Have a happy life :)</p>
//     `
//   });
// };

// const sendAdminApplicationAcceptedEmail = async (to, username) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Your Admin Application Was Accepted 🎉",
//     html: `
//       <h2>Congratulations @${username}!</h2>
//       <p>Your application to become an admin on Glaukopis has been accepted.</p>
//       <p>You now have access to the admin panel. Use your new role responsibly!</p>
//       <p>Have a happy life :)</p>
//     `
//   });
// };

// const sendAdminApplicationRejectedEmail = async (to, username, reason) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Your Admin Application Was Reviewed",
//     html: `
//       <h2>Hello @${username},</h2>
//       <p>Thank you for applying. Unfortunately your application has not been accepted at this time.</p>
//       <p><strong>Reason:</strong> ${reason}</p>
//       <p>You're welcome to reapply in the future.</p>
//       <p>Better luck next time mate....</p>
//       <p>Have a happy life :)</p>
//     `
//   });
// };

// const sendRoomRequestApprovedEmail = async (to, username, subject, major) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Your Room Request Was Approved 🎉",
//     html: `
//       <h2>Hello @${username}!</h2>
//       <p>Your request for a subject room has been approved.</p>
//       <p><strong>Subject:</strong> ${subject}<br/>
//       <strong>Major:</strong> ${major}</p>
//       <p>You've been added to the room. Head to Browse Rooms to find it!</p>
//       <p>Have a happy life :)</p>
//     `
//   });
// };

// const sendRoomRequestRejectedEmail = async (to, username, subject, major, reason) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Your Room Request Was Reviewed",
//     html: `
//       <h2>Hello @${username},</h2>
//       <p>Your request for the following subject room was not approved:</p>
//       <p><strong>Subject:</strong> ${subject}<br/>
//       <strong>Major:</strong> ${major}</p>
//       <p><strong>Reason:</strong> ${reason}</p>
//     `
//   });
// };

// //do i need more creative emails with more personality?....or unhinged?....KEEP THOSE THOUGHTS AWAY
// //what i know is i should have went with smaller damn names.....
// module.exports = {sendResetEmail,
//   sendFollowEmail,
//   sendRoomInviteEmail,
//   sendProfessorRejectionEmail,
//   sendProfessorVerificationEmail,
//   sendAdminApplicationAcceptedEmail,
//   sendAdminApplicationRejectedEmail,
//   sendRoomRequestApprovedEmail,
//   sendRoomRequestRejectedEmail,
//   sendOtpEmail,

// }
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = '"Glaukopis Platform" <onboarding@resend.dev>';

const sendResetEmail = async (toEmail, resetLink) => {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Reset Your Account Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetLink}">Reset My Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, just ignore this email.</p>
      <p>Have a happy life :)</p>
    `
  });
};

const sendOtpEmail = async (email, otp) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your Glaukopis Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 30px; border-radius: 12px; background-color: #f0f4ff;">
        <h2 style="color: #3b5bdb;">Verify Your Email</h2>
        <p>Use the code below to verify your email address. You have <strong>10 minutes</strong> in hand.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #3b5bdb; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888;">If you didn't request this, just ignore this email.</p>
        <p>Have a happy life :)</p>
      </div>
    `
  });
};

const sendFollowEmail = async (toEmail, followerUsername) => {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "You have a new follower!",
    html: `
      <h2>New Follower 🎉</h2>
      <p><strong>@${followerUsername}</strong> started following you on Glaukopis!</p>
      <p>Log in to check out their profile and follow them back.</p>
      <p>Might as well check some other things here....</p>
    `
  });
};

const sendRoomInviteEmail = async (toEmail, username, roomName, inviterUsername) => {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "You've been invited to a private room!",
    html: `
      <h2>Private Room Invite 🏠</h2>
      <p>Hey <strong>@${username}</strong>!</p>
      <p><strong>@${inviterUsername}</strong> has added you to their private room: <strong>${roomName}</strong>.</p>
      <p>Log in to Glaukopis to access it from your profile.</p>
      <p>Have a happy life :)</p>
    `
  });
};

const sendProfessorRejectionEmail = async (toEmail, username, reason) => {
  await resend.emails.send({
    from: FROM,
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
      <p>Better luck next time mate....</p>
    `
  });
};

const sendProfessorVerificationEmail = async (toEmail, username) => {
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Your Professor Status Has Been Verified! 🎓",
    html: `
      <h2>Professor Status Verified 🎉</h2>
      <p>Hey <strong>@${username}</strong>,</p>
      <p>Great news! Your professor status has been <strong>verified</strong> by our team.</p>
      <p>You now have full access to professor features on Glaukopis.</p>
      <p>Log in to get started!</p>
      <p>Have a happy life :)</p>
    `
  });
};

const sendAdminApplicationAcceptedEmail = async (to, username) => {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Admin Application Was Accepted 🎉",
    html: `
      <h2>Congratulations @${username}!</h2>
      <p>Your application to become an admin on Glaukopis has been accepted.</p>
      <p>You now have access to the admin panel. Use your new role responsibly!</p>
      <p>Have a happy life :)</p>
    `
  });
};

const sendAdminApplicationRejectedEmail = async (to, username, reason) => {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Admin Application Was Reviewed",
    html: `
      <h2>Hello @${username},</h2>
      <p>Thank you for applying. Unfortunately your application has not been accepted at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You're welcome to reapply in the future.</p>
      <p>Better luck next time mate....</p>
      <p>Have a happy life :)</p>
    `
  });
};

const sendRoomRequestApprovedEmail = async (to, username, subject, major) => {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Room Request Was Approved 🎉",
    html: `
      <h2>Hello @${username}!</h2>
      <p>Your request for a subject room has been approved.</p>
      <p><strong>Subject:</strong> ${subject}<br/>
      <strong>Major:</strong> ${major}</p>
      <p>You've been added to the room. Head to Browse Rooms to find it!</p>
      <p>Have a happy life :)</p>
    `
  });
};

const sendRoomRequestRejectedEmail = async (to, username, subject, major, reason) => {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Room Request Was Reviewed",
    html: `
      <h2>Hello @${username},</h2>
      <p>Your request for the following subject room was not approved:</p>
      <p><strong>Subject:</strong> ${subject}<br/>
      <strong>Major:</strong> ${major}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `
  });
};

module.exports = {
  sendResetEmail,
  sendFollowEmail,
  sendRoomInviteEmail,
  sendProfessorRejectionEmail,
  sendProfessorVerificationEmail,
  sendAdminApplicationAcceptedEmail,
  sendAdminApplicationRejectedEmail,
  sendRoomRequestApprovedEmail,
  sendRoomRequestRejectedEmail,
  sendOtpEmail,
};