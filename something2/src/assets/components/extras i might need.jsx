{selectedPost && (
  <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
    <div className="modal" onClick={(e) => e.stopPropagation()} style={{width:"600px", maxHeight:"80vh", display:"flex", flexDirection:"column"}}>
      
      {/* header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Comments</h3>
        <button onClick={() => setSelectedPost(null)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:"white"}}>✕</button>
      </div>

      {/* original post */}
      <div style={{padding:"12px", background:"rgba(255,255,255,0.05)", borderRadius:"8px", marginBottom:"15px"}}>
        <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
          <img src={user?.profilePic || Cat} alt="pfp" style={{width:"28px", height:"28px", borderRadius:"50%"}}/>
          <strong>@{selectedPost.authorUsername}</strong>
          <small style={{background:"#6476af", color:"white", padding:"2px 8px", borderRadius:"10px", fontSize:"11px"}}>{selectedPost.authorRole || "user"}</small>
        </div>
        <p style={{margin:0}}>{selectedPost.content}</p>
      </div>

      {/* comments list */}
      <div style={{flex:1, overflowY:"auto", marginBottom:"15px"}}>
        {selectedPost.comments.length === 0 ? (
          <p style={{opacity:0.5, textAlign:"center"}}>No comments yet. Be the first!</p>
        ) : (
          selectedPost.comments.map(comment => (
            <div key={comment.id} style={{padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
              
              {/* comment header */}
              <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px"}}>
                <img src={Cat} alt="pfp" style={{width:"24px", height:"24px", borderRadius:"50%"}}/>
                <strong style={{fontSize:"13px"}}>@{comment.authorUsername}</strong>
                <small style={{opacity:0.5, fontSize:"11px"}}>{new Date(comment.createdAt).toLocaleString()}</small>
              </div>

              {/* comment content */}
              <p style={{margin:"0 0 6px 32px", fontSize:"14px"}}>{comment.content}</p>

              {/* comment votes */}
              <div style={{margin:"4px 0 0 32px", display:"flex", gap:"8px", flexWrap:"wrap"}}>
                <button 
                  onClick={() => isGuest ? alert("Create an account to vote! 👋") : handleCommentVote(selectedPost.id, comment.id, "useful")}
                  style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
                  👍 Useful {comment.votes.useful}
                </button>
                <button 
                  onClick={() =>isGuest ? alert("Create an account to vote! 👋") : handleCommentVote(selectedPost.id, comment.id, "useless")}
                  style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer"}}>
                  👎 Useless {comment.votes.useless}
                </button>
                {/* specialized vote — only for OP or high rated users ....shit still ...i forgot the rating bit till now...weill be done soon*/}
                {(currentUser?.id === selectedPost.authorId || currentUser?.rating >= 4) && (
                  <button 
                    onClick={() =>isGuest ? alert("Create an account to vote!even though this one is useless since only users with strick rules can get this vote... 👋") : handleCommentVote(selectedPost.id, comment.id, "specialized")}
                    style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", background:"#f0c040", border:"none"}}>
                    ✨ Specialized {comment.votes.specialized}
                  </button>

                  
                )}
                {currentUser?.id === comment.authorId && (
                   <button
                      onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                        style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", color:"red"}}>
                          🗑️ Delete
                     </button>
                 )}
                  {currentUser?.id === comment.authorId && (
                      <button
                         onClick={() => {
                             setEditingComment(comment);
                             setEditCommentContent(comment.content);
                          }}
                        style={{fontSize:"11px", padding:"2px 8px", borderRadius:"6px", cursor:"pointer", color:"green"}}>
                          Edit
                      </button>
                   )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* add comment input */}
      <div style={{display:"flex", gap:"8px"}}>
        <input
          type="text"
          placeholder="Write a comment..."
          id="commentInput"
          style={{flex:1, padding:"8px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white"}}
        />
        <button
          onClick={() =>isGuest ? alert("Create an account to contribute....") : handleAddComment(selectedPost.id)}
          style={{padding:"8px 16px", borderRadius:"8px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}
        >
          Send
        </button>
      </div>

    </div>
  </div>
)}


//////////////////////////////////////////
//////////////////////////////////////////////////////////
/////////////////////////////////////////




{editingComment && (
  <div className="modal-overlay" onClick={() => setEditingComment(null)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Edit Comment</h3>
        <button onClick={() => setEditingComment(null)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      <textarea
        value={editCommentContent}
        onChange={(e) => setEditCommentContent(e.target.value)}
        style={{width:"100%", minHeight:"100px", padding:"10px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box", resize:"vertical"}}
      />

      <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"15px"}}>
        <button onClick={() => setEditingComment(null)}>Cancel</button>
        <button onClick={() => handleEditComment(selectedPost.id, editingComment.id)}>Save</button>
      </div>

    </div>
  </div>
)}