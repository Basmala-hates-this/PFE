import { useState, useEffect } from "react";
import axios from "axios";
import Cat from "../../photos/Cat.jpg";

export default function PostModal({ postId, onClose, isGuest }) {
  const token = localStorage.getItem("token");
  const guestToken = localStorage.getItem("guestToken");
  const authToken = token || guestToken;
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [post, setPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [commentInput, setCommentInput] = useState("");




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
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPost(response.data);
  };

  const handleVote = async (voteType) => {
    if (isGuest) return alert("Create an account to vote! 👋");
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
    if (isGuest) return alert("Create an account to contribute....");
    if (!commentInput.trim()) return;
    try {
      await axios.post(
        `http://localhost:5000/api/posts/${postId}/comments`,
        { content: commentInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentInput("");
      refetchPost();
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleCommentVote = async (commentId, voteType) => {
    if (isGuest) return alert("Create an account to vote! 👋");
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
    if (!window.confirm("Delete this comment?")) return;
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
{post.image && (
  <img 
    src={post.image} 
    alt="attachment" 
    style={{maxWidth:"100%", borderRadius:"8px", marginBottom:"8px", display:"block"}}
  />
)}

{/* pdf attachment */}
{post.pdf && (
  <a 
    href={post.pdf} 
    target="_blank" 
    rel="noopener noreferrer"
    style={{display:"inline-flex", alignItems:"center", gap:"6px", padding:"6px 12px", background:"rgba(255,255,255,0.1)", borderRadius:"6px", color:"white", textDecoration:"none", fontSize:"13px", marginBottom:"8px"}}
  >
    📄 View PDF
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
    🔗 {post.resourceLabel || "Open Resource"}
  </a>
)}
          <div style={{display:"flex", gap:"8px"}}>
            <button onClick={() => handleVote("useful")} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
              👍 Useful {post.votes.useful}
            </button>
            <button onClick={() => handleVote("useless")} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
              👎 Useless {post.votes.useless}
            </button>
          </div>
        </div>

        {/* comments list */}
        <div style={{flex:1, overflowY:"auto", marginBottom:"15px"}}>
          {post.comments.length === 0 ? (
            <p style={{opacity:0.5, textAlign:"center"}}>No comments yet. Be the first!</p>
          ) : (
            post.comments.map(comment => (
              <div key={comment.id} style={{padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
                <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px"}}>
                  <img src={Cat} alt="pfp" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                  <strong style={{fontSize:"13px"}}>@{comment.authorUsername}</strong>
                  <small style={{opacity:0.5, fontSize:"11px"}}>{new Date(comment.createdAt).toLocaleString()}</small>
                </div>

                <p style={{margin:"0 0 6px 32px", fontSize:"14px"}}>{comment.content}</p>

                {editingComment?.id === comment.id ? (
                  <div style={{margin:"0 0 0 32px"}}>
                    <input
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      style={{width:"100%", padding:"4px", borderRadius:"4px", marginBottom:"6px"}}
                    />
                    <button onClick={() => handleEditComment(comment.id)} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"4px", marginRight:"6px"}}>Save</button>
                    <button onClick={() => setEditingComment(null)} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"4px"}}>Cancel</button>
                  </div>
                ) : (
                  <div style={{margin:"4px 0 0 32px", display:"flex", gap:"8px", flexWrap:"wrap"}}>
                    <button onClick={() => handleCommentVote(comment.id, "useful")} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
                      👍 Useful {comment.votes.useful}
                    </button>
                    <button onClick={() => handleCommentVote(comment.id, "useless")} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
                      👎 Useless {comment.votes.useless}
                    </button>
                    {(currentUser?.id === post.authorId || currentUser?.rating >= 4) && (
                      <button onClick={() => handleCommentVote(comment.id, "specialized")} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", background:"#f0c040", border:"none"}}>
                        ✨ Specialized {comment.votes.specialized}
                      </button>
                    )}
                    {currentUser?.id === comment.authorId && (
                      <>
                        <button onClick={() => handleDeleteComment(comment.id)} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", color:"red"}}>🗑️ Delete</button>
                        <button onClick={() => { setEditingComment(comment); setEditCommentContent(comment.content); }} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", color:"green"}}>✏️ Edit</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* add comment */}
        <div style={{display:"flex", gap:"8px"}}>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Write a comment..."
            style={{flex:1, padding:"8px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white"}}
          />
          <button onClick={handleAddComment} style={{padding:"8px 16px", borderRadius:"8px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}