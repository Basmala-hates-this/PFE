const notifRepo = require('../repositories/notificationRepository');
const NOTIF_TYPES = require('../constants/notifTypes');
const db = require('../db');


const notifyNewMessage = async (roomId, senderId, senderUsername, roomName, messageId) => {
  await notifRepo.createRoomNotifications({
    roomId,
    excludeUserId: senderId,
    type: NOTIF_TYPES.NEW_MESSAGE,
    title: roomName,
    body: `@${senderUsername} sent a message`,
    entityType: 'message',
    entityId: messageId,
  });
};

const notifyNewPost = async (roomId, authorId, authorUsername, roomName, postId, postTitle) => {
  await notifRepo.createRoomNotifications({
    roomId,
    excludeUserId: authorId,
    type: NOTIF_TYPES.NEW_POST,
    title: roomName,
    body: postTitle
      ? `@${authorUsername} posted: "${postTitle}"`
      : `@${authorUsername} made a new post`,
    entityType: 'post',
    entityId: postId,
  });
};

const notifyPostReply = async (postOwnerId, replierUsername, postId, roomId) => {
  await notifRepo.createNotification({
    userId: postOwnerId,
    type: NOTIF_TYPES.POST_REPLY,
    title: 'New reply on your post',
    body: `@${replierUsername} replied to your post`,
    entityType: 'post',
    entityId: postId,
    roomId,
  });
};

const notifyCommentReply = async (parentCommentOwnerId, replierUsername, postId, roomId) => {
  await notifRepo.createNotification({
    userId: parentCommentOwnerId,
    type: NOTIF_TYPES.COMMENT_REPLY,
    title: 'New reply on your comment',
    body: `@${replierUsername} replied to your comment`,
    entityType: 'post',
    entityId: postId,
    roomId,
  });
};
const notifyAnnouncement = async (posterId, adminUsername, announcementId, snippet) => {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
     SELECT u.id, $1, $2, $3, $4, $5
     FROM users u
     WHERE u.id != $6
     AND (u.suspended_until IS NULL OR u.suspended_until < NOW())`,
    [
      NOTIF_TYPES.ANNOUNCEMENT,
      'New Announcement',
      snippet ? snippet.slice(0, 80) : `@${adminUsername} posted an announcement`,
      'announcement',
      announcementId,
      posterId,
    ]
  );
};
const notifyRoomInvite = async (userId, inviterUsername, roomName, roomId) => {
  await notifRepo.createNotification({
    userId,
    type: NOTIF_TYPES.ROOM_INVITE,
    title: 'You were added to a room',
    body: `@${inviterUsername} added you to "${roomName}"`,
    entityType: 'room',
    entityId: roomId,
    roomId,
  });
};

module.exports = {
  notifyNewMessage,
  notifyNewPost,
  notifyPostReply,
  notifyCommentReply,
  notifyAnnouncement,
  notifyRoomInvite,
};