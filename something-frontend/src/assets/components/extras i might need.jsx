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




// const DEFAULT_UNIVERSITIES = [
//   { code: "UA1", name: "University Of Algiers 1- Benyoucef Benkhedda" },
//   { code: "UA2", name: "University Of Algiers 2- Abou El Kacem Saadallah" },
//   { code: "UA3", name: "University Of Algiers 3- Dely Ibrahim" },
//   {
//     code: "USTHB",
//     name: "University Of Science And Technology Houari Boumediene",
//   },
//   { code: "ENP", name: "National Polytechnic School Of Algiers" },
//   { code: "ESNA", name: "National Higher School of Agronomy" },
//   { code: "NHV", name: "National Higher Veterinary School" },
//   { code: "BMU", name: "Badji Mokhtar University-Annaba" },
//   { code: "UB1", name: "University Of Batna 1" },
//   { code: "UB2", name: "University Of Batna 2" },
//   { code: "UBj", name: "University Of Bejaia" },
//   { code: "UBs", name: "University Of Biskra Mohamed Khider" },
//   { code: "UBl1", name: "University Of Blida 1-Saad Dahlab" },
//   { code: "Ubl2", name: "University Of Blida 2-Ali Lounici" },
//   { code: "UCh", name: "University Of Chlef-Hassiba Benbouali" },
//   { code: "UC1", name: "University Of Constantine 1-Mentouri Brothers" },
//   { code: "UC2", name: "University Of Constantine 2-Abdelhamid Mehri" },
//   { code: "UC3", name: "University Of Constantine 3-Salah Boubnider" },
//   { code: "UD", name: "University of Djelfa - Ziane Achour" },
//   { code: "UG", name: "University of Guelma - 8 May 1945" },
//   { code: "UJ", name: "University of Jijel" },
//   { code: "UL", name: "University of Laghouat - Amar Telidji" },
//   { code: "UM", name: "University of Mostaganem - Abdelhamid Ibn Badis" },
//   { code: "UMs", name: "University of M'Sila - Mohamed Boudiaf" },
//   { code: "UO1", name: "University of Oran 1 - Ahmed Ben Bella" },
//   { code: "UO2", name: "University of Oran 2 - Mohamed Ben Ahmed" },
//   {
//     code: "USTO",
//     name: "University of Science and Technology of Oran - Mohamed Boudiaf",
//   },
//   { code: "UOr", name: "University of Ouargla - Kasdi Merbah" },
//   { code: "USa", name: "University of Saida - Dr. Moulay Tahar" },
//   { code: "USBA", name: "Djillali Liabes University of Sidi Bel Abbes" },
//   { code: "USk", name: "University of Skikda - 20 August 1955" },
//   { code: "USA", name: "University of Souk Ahras - Mohamed Cherif Messaadia" },
//   { code: "US1", name: "University of Setif 1 - Ferhat Abbas" },
//   { code: "US2", name: "University of Setif 2" },
//   { code: "UTi", name: "University of Tiaret - Ibn Khaldoun" },
//   { code: "UTl", name: "University of Tlemcen - Abou Bekr Belkaid" },
//   { code: "UTO", name: "University of Tizi Ouzou - Mouloud Mammeri" },
// ];

// const DEFAULT_MAJORS = [
//   "Computer Science",
//   "Mathematics",
//   "Physics",
//   "Chemistry",
//   "Biology",
//   "Civil Engineering",
//   "Mechanical Engineering",
//   "Electrical Engineering",
//   "Process Engineering",
//   "Architecture",
//   "Natural and Life Science",
//   "Agronomy",
//   "Renewable Energies",
//   "Geology",
//   "Medicine",
//   "Pharmacy",
//   "Dental Medicine",
//   "Veterinary Medicine",
//   "Law",
//   "Political Science & International Relations",
//   "Economics & Commerce & Management Science",
//   "History",
//   "Psychology",
//   "Sociology",
//   "Philosophy",
//   "Literature & Languages",
//   "Information & Communucation Science",
//   "Sport Science & Physical Education",
//   "Art & Design",
// ];
