const endorsementRepo = require('../repositories/peerEndorsement.repo');

const createEndorsement = async (req, res) => {
  try {
    const { commentId } = req.params;
    const endorserId = req.user.id;

    const context = await endorsementRepo.getCommentWithPostContext(commentId);
    if (!context) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (context.postAuthorId !== endorserId) {
      return res.status(403).json({ message: 'Only the post author can endorse a comment' });
    }

    if (context.commentAuthorId === endorserId) {
      return res.status(400).json({ message: 'You cannot endorse yourself' });
    }

    const result = await endorsementRepo.createEndorsement({
      endorserId,
      endorseeId: context.commentAuthorId,
      postId: context.postId,
      roomId: context.roomId,
      commentId,
    });

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    return res.status(201).json({ endorsement: result });
  } catch (err) {
    console.error('createEndorsement error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const getEndorsementsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const endorsements = await endorsementRepo.getEndorsementsForUser(userId);
    return res.json(endorsements);
  } catch (err) {
    console.error('getEndorsementsForUser error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  createEndorsement,
  getEndorsementsForUser,
};