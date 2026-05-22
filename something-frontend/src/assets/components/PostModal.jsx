import { useState, useEffect } from "react";
import axios from "axios";
import Cat from "../../photos/Cat.jpg";
import ReportModal from "./ReportModal.jsx";
 import { useTranslation } from 'react-i18next';
// import i18n from '../i18n/index.js';
//threaded comments are more complicated then i thought

function CommentNode({ comment, postId, currentUser, isGuest, onVote, onDelete, onEdit, onReply, editingComment, editCommentContent, setEditCommentContent, handleEditComment, setEditingComment, depth = 0 }) {
  const { t } = useTranslation();
  
  if (comment.isHidden) return (
    <div style={{ marginLeft: depth > 0 ? "20px" : "0", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: 0.4, fontStyle: "italic", fontSize: "13px" }}>
      {t('postModal.hiddenComment')}
    </div>
  );
 
  
  return (
    <div style={{ marginLeft: depth > 0 ? "20px" : "0", borderLeft: depth > 0 ? "2px solid rgba(100,118,175,0.3)" : "none", paddingLeft: depth > 0 ? "10px" : "0" }}>
      <div style={{ padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <strong style={{ fontSize: "13px" }}>@{comment.authorUsername}</strong>
          {depth > 0 && <small style={{ opacity: 0.4, fontSize: "11px" }}>↩ reply</small>}
          <small style={{ opacity: 0.5, fontSize: "11px" }}>{new Date(comment.createdAt).toLocaleString()}</small>
        </div>

        <p style={{ margin: "0 0 6px", fontSize: "14px" }}>{comment.content}</p>

        {/* attachments */}
        {comment.imageUrl && (
          <div style={{ marginBottom: "6px" }}>
            <a href={comment.imageUrl} target="_blank" rel="noopener noreferrer">
              <img src={comment.imageUrl} alt="attachment" style={{ maxWidth: "100%", borderRadius: "8px", display: "block", cursor: "pointer" }} />
            </a>
          </div>
        )}
        {comment.pdfUrl && (
          <a href={comment.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "white", textDecoration: "none", fontSize: "13px", marginBottom: "6px" }}>
           {t('postModal.viewPdf')}
          </a>
        )}
        {comment.resourceLink && (
          <a href={comment.resourceLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(100,118,175,0.3)", borderRadius: "6px", color: "white", textDecoration: "none", fontSize: "13px", marginBottom: "6px" }}>
            🔗 {comment.resourceLabel || t('postModal.openResource')}
          </a>
        )}

        {/* actions */}
        {editingComment?.id === comment.id ? (
          <div>
            <input value={editCommentContent} onChange={e => setEditCommentContent(e.target.value)}
              style={{ width: "100%", padding: "4px", borderRadius: "4px", marginBottom: "6px" }} />
            <button onClick={() => handleEditComment(comment.id)} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", marginRight: "6px" }}>{t('postModal.saveComment')}</button>
            <button onClick={() => setEditingComment(null)} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px" }}>{t('postModal.cancelComment')}</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => onVote(comment.id, "useful")} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", cursor: "pointer" , color: "#27ae60", background: "none", border: "1px solid #27ae60b3"  }}>
              👍 {comment.voteUseful}
            </button>
            <button onClick={() => onVote(comment.id, "useless")} style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer",color:"#c0392b", background:"none", border:"1px solid #c0392bb3" }}>
              👎 {comment.voteUseless}
            </button>
            {(currentUser?.id === comment.userId|| currentUser?.rating >= 4) && (
              <button onClick={() => onVote(comment.id, "specialized")} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", cursor: "pointer", background: "#f0c040", border: "none" }}>
                ✨ {comment.voteSpecialized}
              </button>
            )}
            {!isGuest && (
              <button onClick={() => onReply(comment)} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", cursor: "pointer", background: "rgba(100,118,175,0.3)", border: "none", color: "white" }}>
                  {t('postModal.reply')}    
            </button>
            )}
            {currentUser?.id === comment.userId && (
              <>
                <button onClick={() => onDelete(comment.id)} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", cursor: "pointer", color: "red" }}>🗑️</button>
                <button onClick={() => { setEditingComment(comment); setEditCommentContent(comment.content); }} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", cursor: "pointer", color: "green" }}>✏️</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* replies */}
      {comment.replies?.map(reply => (
        <CommentNode key={reply.id} comment={reply} postId={postId} currentUser={currentUser}
          isGuest={isGuest} onVote={onVote} onDelete={onDelete} onEdit={onEdit} onReply={onReply}
          editingComment={editingComment} editCommentContent={editCommentContent}
          setEditCommentContent={setEditCommentContent} handleEditComment={handleEditComment}
          setEditingComment={setEditingComment} depth={depth + 1} />
      ))}
    </div>
  );
}

//////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export default function PostModal({ postId, onClose, isGuest }) {
  const token = localStorage.getItem("token");
  const guestToken = localStorage.getItem("guestToken");
  const authToken = token || guestToken;
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [post, setPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [commentInput, setCommentInput] = useState("");


  const [commentAttachment, setCommentAttachment] = useState(null);
const [commentResourceLink, setCommentResourceLink] = useState("");
const [commentResourceLabel, setCommentResourceLabel] = useState("");
const [reportTarget, setReportTarget] = useState(null);

const [replyingTo, setReplyingTo] = useState(null); 

const [comments, setComments] = useState([]);

const [commentFilter, setCommentFilter] = useState("all");

const { t } = useTranslation();

//////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
  // fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/posts/${postId}`,
          { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} }
        );
        setPost(response.data);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      }
    };
    fetchPost();
  }, [postId]);

  
  
const refetchPost = async () => {
  const [postRes, commentsRes] = await Promise.all([
    axios.get(`http://localhost:5000/api/posts/${postId}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} // ← fix here
    }),
    axios.get(`http://localhost:5000/api/posts/${postId}/comments`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    })
  ]);
  console.log("comment sample:", commentsRes.data[0]);
  setPost(postRes.data);
  setComments(commentsRes.data);
};

useEffect(() => {
  refetchPost();
}, [postId]);


  /////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////

 const handleVote = async (postId, voteType) => {
  try {
    await axios.patch(
      `http://localhost:5000/api/posts/${postId}/vote`,
      { voteType },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    refetchPost();
  } catch (err) {
    console.error("Failed to vote:", err);
  }
};

const handleAddComment = async () => {
  if (isGuest) return alert(t('postModal.guestCommentAlert'));
  if (!commentInput.trim() && !commentAttachment) return;
  try {
    const formData = new FormData();
    formData.append("content", commentInput);
    if (replyingTo) formData.append("parentCommentId", replyingTo.id);
    if (commentAttachment) formData.append("attachment", commentAttachment);
    if (commentResourceLink.trim()) formData.append("resourceLink", commentResourceLink);
    if (commentResourceLabel.trim()) formData.append("resourceLabel", commentResourceLabel);

    await axios.post(
      `http://localhost:5000/api/posts/${postId}/comments`,
      formData,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
    );
    console.log("first comment:", comments[0]);
    setCommentInput("");
    setCommentAttachment(null);
    setCommentResourceLink("");
    setCommentResourceLabel("");
    setReplyingTo(null); 
    refetchPost();
  } catch (err) {
    console.error("Failed to add comment:", err);
  }
};

  const handleCommentVote = async (commentId, voteType) => {
    if (isGuest) return alert(t('postModal.guestCommentAlert'));
    try {
      await axios.patch(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}/vote`,
        { voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refetchPost();
    } catch (err) {
      console.error("Failed to vote on comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t('postModal.deleteCommentConfirm'))) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refetchPost();
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
        { content: editCommentContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingComment(null);
      refetchPost();
    } catch (err) {
      console.error("Failed to edit comment:", err);
    }
  };

  if (!post) return null;

  
  if (post.isHidden) return (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()} style={{padding:"30px", textAlign:"center"}}>
      <p style={{fontSize:"24px"}}>🙈</p>
      <p>{t('postModal.hiddenPost')}</p>
      <button onClick={onClose} style={{marginTop:"10px", padding:"8px 20px", borderRadius:"8px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}>
        {t('postModal.close')}
      </button>
    </div>
  </div>
);

//threaded comments tree builders:
const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];
  comments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
  comments.forEach(c => {
    if (c.parentCommentId && map[c.parentCommentId]) {
      map[c.parentCommentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
};



  ////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{width:"600px", maxHeight:"80vh", display:"flex", flexDirection:"column"}}>
        
        {/* header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
          <h3 style={{margin:0}}>{post.title || "Post"}</h3>
          <button onClick={onClose} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"white"}}>✕</button>
        </div>

        {/* original post */}
        <div style={{padding:"12px", background:"rgba(255,255,255,0.05)", borderRadius:"8px", marginBottom:"10px"}}>
          <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
            <img src={post.authorProfilePic || Cat} alt="pfp" style={{width:"28px", height:"28px", borderRadius:"50%"}}/>
            <strong>@{post.authorUsername}</strong>
            <small style={{background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"11px"}}>{post.authorRole || "user"}</small>
          </div>
          <p style={{margin:"0 0 8px"}}>{post.content}</p>
          {/* image attachment */}
{post.imageUrl && (
  <div style={{marginBottom:"8px"}}>
    <a href={post.imageUrl} target="_blank" rel="noopener noreferrer">
      <img 
        src={post.imageUrl} 
        alt="attachment" 
        style={{maxWidth:"100%", borderRadius:"8px", display:"block", cursor:"pointer"}}
      />
    </a>
    <a
      href={post.imageUrl}
      download
      style={{display:"inline-block", marginTop:"4px", fontSize:"11px", color:"#8ca4c6"}}
    >
      {t('postModal.downloadImage')}
    </a>
  </div>
)}

{/* pdf attachment */}
{post.pdfUrl && (
  <a 
    href={post.pdfUrl} 
    target="_blank" 
    rel="noopener noreferrer"
    style={{display:"inline-flex", alignItems:"center", gap:"6px", padding:"6px 12px", background:"rgba(255,255,255,0.1)", borderRadius:"6px", color:"white", textDecoration:"none", fontSize:"13px", marginBottom:"8px"}}
  >
    {t('postModal.viewPdf')}
  </a>
)}

{/* resource link */}
{post.resourceLink && (
  <a 
    href={post.resourceLink} 
    target="_blank" 
    rel="noopener noreferrer"
    style={{display:"inline-flex", alignItems:"center", gap:"6px", padding:"6px 12px", background:"rgba(100,118,175,0.3)", borderRadius:"6px", color:"white", textDecoration:"none", fontSize:"13px", marginBottom:"8px"}}
  >
    🔗 {post.resourceLabel || (t('postModal.openResource'))}
  </a>
)}
          <div style={{display:"flex", gap:"8px"}}>
            <button onClick={() => handleVote("useful")} style={{fontSize: "11px", padding: "2px 8px", borderRadius: "6px", cursor: "pointer" , color: "#27ae60", background: "none", border: "1px solid #27ae60b3"}}>
              {t('postModal.useful')} {post.votesUseful}
            </button>
            <button onClick={() => handleVote("useless")} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer",color:"#c0392b", background:"none", border:"1px solid #c0392bb3"}}>
              {t('postModal.useless')} {post.votesUseless}
            </button>
            {!isGuest && currentUser?.id !== post.userId && (
              <button
                 onClick={() => setReportTarget({ type: "post", postId: post.id })}
                 style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px",
                 cursor: "pointer", color: "#c0392b", background: "none", border: "none" }}>
                 {t('postModal.report')}
                 </button>
                )}
          </div>
        </div>
{/* //////////////////////////////////////////////////////// */}
<div style={{ display: "flex", gap: "8px", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
  {[
    { key: "all", label:(t('postModal.commentFilters.all')) },
    { key: "popular", label: t('postModal.commentFilters.popular') },
    { key: "recent", label: t('postModal.commentFilters.recent') },
    { key: "specialized", label: t('postModal.commentFilters.specialized') },
  ].map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setCommentFilter(key)}
      style={{
        padding: "4px 14px",
        borderRadius: "20px",
        border: "1px solid rgba(100,118,175,0.4)",
        background: commentFilter === key ? "#6476af" : "transparent",
        color: "white",
        cursor: "pointer",
        fontSize: "12px",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  ))}
</div>

        {/* comments list */}
       <div style={{ flex: 1, overflowY: "auto", marginBottom: "15px" }}>
  {comments.length === 0 ? (
    <p style={{ opacity: 0.5, textAlign: "center" }}>{t('postModal.noComments')}</p>
  ) : (() => {
      // Sort roots only, replies stay nested under parent
      const sortRoots = (roots) => {
  if (commentFilter === "popular")
    return [...roots].sort((a, b) => (b.voteUseful ?? 0) - (a.voteUseful ?? 0));
  if (commentFilter === "recent")
    return [...roots].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (commentFilter === "specialized")
    return [...roots].sort((a, b) => (b.voteSpecialized ?? 0) - (a.voteSpecialized ?? 0));
  return roots; // "all" = original server order
};

      return sortRoots(buildCommentTree(comments)).map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          postId={postId}
          currentUser={currentUser}
          isGuest={isGuest}
          onVote={handleCommentVote}
          onDelete={handleDeleteComment}
          onReply={(c) => setReplyingTo({ id: c.id, username: c.authorUsername })}
          editingComment={editingComment}
          editCommentContent={editCommentContent}
          setEditCommentContent={setEditCommentContent}
          handleEditComment={handleEditComment}
          setEditingComment={setEditingComment}
        />
      ));
  })()}
</div>

        {/* add comment */}
<div style={{borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:"10px"}}>
  {replyingTo && (
  <div style={{ marginBottom: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "rgba(100,118,175,0.2)", borderRadius: "6px" }}>
    {t('postModal.replyingTo')} <strong>@{replyingTo.username}</strong>
    <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", color: "#fc0c0c", cursor: "pointer", fontSize: "11px", marginLeft: "auto" }}>✕ {t('postModal.cancelReply')}</button>
  </div>
)}
  {/* attachment preview */}
  {commentAttachment && (
    <div style={{marginBottom:"6px", fontSize:"12px", opacity:0.7, display:"flex", alignItems:"center", gap:"6px"}}>
      📎 {commentAttachment.name}
      <button onClick={() => setCommentAttachment(null)} style={{background:"none", border:"none", color:"#fc0c0c", cursor:"pointer", fontSize:"11px"}}>✕</button>
    </div>
  )}

  {/* resource link inputs */}
  <div style={{display:"flex", gap:"6px", marginBottom:"6px"}}>
    <input
      type="url"
      placeholder={t('postModal.resourceLinkPlaceholder')}
      value={commentResourceLink}
      onChange={(e) => setCommentResourceLink(e.target.value)}
      style={{flex:1, padding:"6px", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white", fontSize:"12px"}}
    />
    <input
      type="text"
      placeholder={t('postModal.resourceLabelPlaceholder')}
      value={commentResourceLabel}
      onChange={(e) => setCommentResourceLabel(e.target.value)}
      style={{flex:1, padding:"6px", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white", fontSize:"12px"}}
    />
  </div>

  {/* main input row */}
  <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
    {/* hidden file input */}
    <input
      type="file"
      id="commentFileInput"
      accept="image/*,.pdf"
      style={{display:"none"}}
      onChange={(e) => setCommentAttachment(e.target.files[0])}
    />
    <button
      onClick={() => document.getElementById("commentFileInput").click()}
      style={{background:"none", border:"none", fontSize:"18px", cursor:"pointer", padding:"4px"}}
    >
      📎
    </button>
    <input
      type="text"
      value={commentInput}
      onChange={(e) => setCommentInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
      placeholder={t('postModal.commentPlaceholder')}
      style={{flex:1, padding:"8px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white"}}
    />
    <button onClick={handleAddComment} style={{padding:"8px 16px", borderRadius:"8px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}>
     {t('postModal.send')}
    </button>
  </div>

</div>



{reportTarget && (
  <ReportModal
    type={reportTarget.type}
    postId={reportTarget.postId}
    commentId={reportTarget.commentId}
    onClose={() => setReportTarget(null)}
  />
)}
      </div>
    </div>
  );
}