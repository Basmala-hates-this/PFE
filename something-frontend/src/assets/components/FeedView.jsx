// src/assets/components/FeedView.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import Cat from "../../photos/Cat.jpg";
import { useTranslation } from "react-i18next";

export default function FeedView({ user, isGuest, posts, setPosts, userRooms, setUserRooms }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [sortBy, setSortBy] = useState("random");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ posts: [], users: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [selectedPostRoom, setSelectedPostRoom] = useState(null);
  const [postAttachment, setPostAttachment] = useState(null);
  const [postResourceLink, setPostResourceLink] = useState("");
  const [postResourceLabel, setPostResourceLabel] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const guestToken = localStorage.getItem("guestToken");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Fetch rooms and posts
  const fetchRoomsAndPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let allowedRooms = [];

      if (isGuest) {
        const response = await axios.get("http://localhost:5000/api/rooms/public-rooms");
        const guestUniversities = JSON.parse(localStorage.getItem("guestUniversities")) || [];
        const selectedCodes = guestUniversities.map((u) => u.value);
        allowedRooms = response.data.filter(r => r.type === "public" || selectedCodes.includes(r.universityCode));
      } else {
        const response = await axios.get("http://localhost:5000/api/rooms/my-rooms", {
          headers: { Authorization: `Bearer ${token}` }
        });
        allowedRooms = response.data;
      }

      setUserRooms(allowedRooms);

      // Fetch saved posts
      if (!isGuest) {
        try {
          const savedRes = await axios.get("http://localhost:5000/api/posts/saved", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSavedPostIds(savedRes.data.map((p) => p.id));
        } catch (err) {
          console.error("Failed to fetch saved posts:", err);
        }
      }

      let url = "http://localhost:5000/api/posts";
      if (selectedRooms.length === 1) {
        url += `?roomId=${selectedRooms[0].value}`;
      }
      const postsResponse = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : guestToken ? { Authorization: `Bearer ${guestToken}` } : {}
      });

      if (isGuest) {
        const allowedRoomIds = allowedRooms.map((r) => r.id);
        setPosts(postsResponse.data.filter(p => allowedRoomIds.includes(p.roomId)));
      } else {
        const publicPosts = postsResponse.data.filter(p => {
          if (!p.roomId) return false;
          const room = allowedRooms.find(r => r.id === p.roomId);
          return room ? room.type !== "private" : false;
        });
        setPosts(publicPosts);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndPosts();
  }, [selectedRooms]);

  // Handle vote
  const handleVote = async (postId, voteType) => {
    const previousPosts = posts;
    const currentVote = posts.find(p => p.id === postId)?.userVote;
    const alreadyVoted = currentVote === voteType;

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        voteUseful: voteType === "useful"
          ? Number(post.voteUseful) + (alreadyVoted ? -1 : 1)
          : Number(post.voteUseful) - (currentVote === "useful" ? 1 : 0),
        voteUseless: voteType === "useless"
          ? Number(post.voteUseless) + (alreadyVoted ? -1 : 1)
          : Number(post.voteUseless) - (currentVote === "useless" ? 1 : 0),
        userVote: alreadyVoted ? null : voteType,
      };
    }));

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:5000/api/posts/${postId}/vote`, { voteType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const response = await axios.get(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...response.data } : p).filter(p => !p.isHidden));
    } catch (err) {
      console.error("Failed to vote:", err);
      setPosts(previousPosts);
    }
  };

  // Handle submit post
  const handleSubmitPost = async () => {
    if (!postContent.trim() || !selectedPostRoom) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("title", postTitle || "Post");
      formData.append("roomId", selectedPostRoom.value);
      if (postAttachment) formData.append("attachment", postAttachment);
      if (postResourceLink.trim()) formData.append("resourceLink", postResourceLink);
      if (postResourceLabel.trim()) formData.append("resourceLabel", postResourceLabel);

      const response = await axios.post("http://localhost:5000/api/posts", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      setPosts(prev => [response.data, ...prev]);
      setPostContent("");
      setPostTitle("");
      setSelectedPostRoom(null);
      setPostAttachment(null);
      setPostResourceLink("");
      setPostResourceLabel("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit post
  const handleEditPost = async (postId) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:5000/api/posts/${postId}`, { title: editPostTitle, content: editPostContent }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, title: editPostTitle, content: editPostContent, isUpdated: true } : p));
      setEditingPost(null);
    } catch (err) {
      console.error("Failed to edit post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId) => {
    const confirm = window.confirm(t('dashboard.post.deleteConfirm'));
    if (!confirm) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  // Handle save post
  const handleSavePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (savedPostIds.includes(postId)) {
        await axios.delete(`http://localhost:5000/api/posts/${postId}/save`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedPostIds(prev => prev.filter(id => id !== postId));
      } else {
        await axios.post(`http://localhost:5000/api/posts/${postId}/save`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedPostIds(prev => [...prev, postId]);
      }
    } catch (err) {
      console.error("Failed to save/unsave post:", err);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults({ posts: [], users: [] });
      setShowSearchDropdown(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const authHeader = token ? { Authorization: `Bearer ${token}` } : guestToken ? { Authorization: `Bearer ${guestToken}` } : {};
      const requests = [axios.get(`http://localhost:5000/api/posts/search?q=${query}`, { headers: authHeader })];
      if (!isGuest) {
        requests.push(axios.get(`http://localhost:5000/api/users/search?q=${query}`, { headers: { Authorization: `Bearer ${token}` } }));
      }
      const results = await Promise.all(requests);
      setSearchResults({ posts: results[0].data, users: isGuest ? [] : results[1].data });
      setShowSearchDropdown(true);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const getRoomName = (roomId) => {
    const room = userRooms.find(r => r.id === roomId);
    return room ? room.name : roomId;
  };

  const groupedRoomOptions = [
    { label: "Public", options: userRooms.filter(r => r.type === "public").map(r => ({ value: r.id, label: r.name })) },
    { label: "University", options: userRooms.filter(r => r.type === "university").map(r => ({ value: r.id, label: r.name })) },
    { label: "Majors", options: userRooms.filter(r => r.type === "major").map(r => ({ value: r.id, label: r.name })) },
    ...userRooms.filter(r => r.type === "subject").reduce((groups, room) => {
      const label = "Subjects";
      const existing = groups.find(g => g.label === label);
      if (existing) existing.options.push({ value: room.id, label: room.name });
      else groups.push({ label, options: [{ value: room.id, label: room.name }] });
      return groups;
    }, [])
  ].filter(group => group.options.length > 0);

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "popular") return b.voteUseful - b.voteUseless - (a.voteUseful - a.voteUseless);
    return 0;
  });

  const customSelectStyles = {
    control: (provided) => ({ ...provided, backgroundColor: "transparent", border: "2px solid rgba(255, 255, 255, 0.68)", borderRadius: "12px", padding: "4px", minHeight: "10px", fontSize: "16px", width: "100%" }),
    menu: (provided) => ({ ...provided, backgroundColor: "#1e2a3a", borderRadius: "12px" }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? "#4a5568" : state.isFocused ? "#2d3748" : "transparent", color: "#ffffff" }),
    singleValue: (provided) => ({ ...provided, color: "#ffffff" }),
    input: (provided) => ({ ...provided, color: "#ffffff" })
  };

  return (
    <div className="feed-view">
      {/* Welcome Header */}
      <header className="feed-header">
        <h1>
          {t('dashboard.header.welcome')}{" "}
          <span className="usernameDisplay">
            @{isGuest ? t('dashboard.header.guest') : user?.username || "User"}
            <small className="tag" style={{ marginLeft: "5px" }}>
              {isGuest ? t('dashboard.header.guestTag') : user?.role}
            </small>
          </span>
        </h1>
      </header>

      {/* Controls Row */}
      <section className="feed-controls">
        <div className="room-select-wrapper">
          <Select
            isMulti
            options={groupedRoomOptions}
            value={selectedRooms}
            onChange={(selected) => setSelectedRooms(selected || [])}
            placeholder={t('dashboard.feed.selectRooms')}
            styles={customSelectStyles}
          />
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            className="dashSearch"
            placeholder={t('dashboard.feed.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
          />
          {showSearchDropdown && (
            <div className="search-dropdown">
              {/* Search results same as before */}
            </div>
          )}
        </div>

        <button className="postBtn" onClick={() => isGuest ? alert(t('dashboard.post.guestVoteAlert')) : setIsModalOpen(true)}>
          {t('dashboard.feed.writePost')}
        </button>
      </section>

      {/* Feed */}
      <section className="fyp-container">
        <div className="feed-filters">
          {[
            { key: "random", label: t('dashboard.feed.sortAll') },
            { key: "recent", label: t('dashboard.feed.sortRecent') },
            { key: "popular", label: t('dashboard.feed.sortPopular') }
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)} className={`filter-btn ${sortBy === key ? "active" : ""}`}>
              {label}
            </button>
          ))}
          <button onClick={fetchRoomsAndPosts} className="refresh-btn">
            {t('dashboard.sidebar.refreshFeed')}
          </button>
        </div>

        <div className="fyp-feed">
          {loading ? (
            <p>{t('dashboard.feed.loading')}...</p>
          ) : posts.length === 0 ? (
            <p>{t('dashboard.feed.empty')}✨</p>
          ) : (
            sortedPosts.map((post) => {
              if (post.isHidden) return null;
              return (
                <div key={post.id} className="mock-post">
                  <div className="post-header">
                    <img src={post.authorProfilePic || Cat} alt="pfp" className="post-pfp" />
                    <strong>@{post.authorUsername}</strong>
                    <small className="role-badge">{post.authorRole || "user"}</small>
                    <small className="room-name">{getRoomName(post.roomId)}</small>
                  </div>
                  <div className="post-body">
                    {post.title && <h3>{post.title}</h3>}
                    <p>{post.content}</p>
                  </div>
                  {/* Attachments */}
                  {post.imageUrl && (
                    <div className="post-attachment">
                      <img src={post.imageUrl} alt="attachment" />
                    </div>
                  )}
                  {post.pdfUrl && (
                    <a href={post.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
                      {t('dashboard.post.viewPdf')}
                    </a>
                  )}
                  {post.resourceLink && (
                    <a href={post.resourceLink} target="_blank" rel="noopener noreferrer" className="resource-link">
                      🔗 {post.resourceLabel || "Open Resource"}
                    </a>
                  )}
                  <small className="post-time">{new Date(post.createdAt).toLocaleString()}</small>
                  <div className="post-actions">
                    <button onClick={() => isGuest ? alert(t('dashboard.post.guestVoteAlert')) : handleVote(post.id, "useful")} className="vote-useful">
                      👍 {post.voteUseful} {t('dashboard.post.useful')}
                    </button>
                    <button onClick={() => isGuest ? alert(t('dashboard.post.guestVoteAlert')) : handleVote(post.id, "useless")} className="vote-useless">
                      👎 {post.voteUseless} {t('dashboard.post.useless')}
                    </button>
                    <button onClick={() => setSelectedPost(post)} className="comments-btn">
                      💬 {post.commentCount} {t('dashboard.post.comments')}
                    </button>
                    {!isGuest && (
                      <button onClick={() => handleSavePost(post.id)} className={`save-btn ${savedPostIds.includes(post.id) ? "saved" : ""}`}>
                        {savedPostIds.includes(post.id) ? t('dashboard.post.saved') : t('dashboard.post.save')}
                      </button>
                    )}
                    {!isGuest && currentUser?.id !== post.userId && (
                      <button onClick={() => setReportTarget({ type: "post", postId: post.id })} className="report-btn">
                        {t('dashboard.post.report')}
                      </button>
                    )}
                    {currentUser?.id === post.userId && (
                      <>
                        <button onClick={() => handleDeletePost(post.id)} className="delete-btn">{t('dashboard.post.delete')}</button>
                        <button onClick={() => { setEditingPost(post); setEditPostTitle(post.title); setEditPostContent(post.content); }} className="edit-btn">{t('dashboard.post.edit')}</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modals */}
      {isModalOpen && <PostCreateModal onClose={() => setIsModalOpen(false)} onSubmit={handleSubmitPost} postTitle={postTitle} setPostTitle={setPostTitle} postContent={postContent} setPostContent={setPostContent} selectedPostRoom={selectedPostRoom} setSelectedPostRoom={setSelectedPostRoom} postAttachment={postAttachment} setPostAttachment={setPostAttachment} postResourceLink={postResourceLink} setPostResourceLink={setPostResourceLink} postResourceLabel={postResourceLabel} setPostResourceLabel={setPostResourceLabel} groupedRoomOptions={groupedRoomOptions} isSubmitting={isSubmitting} t={t} />}
      {editingPost && <PostEditModal post={editingPost} onClose={() => setEditingPost(null)} onSave={handleEditPost} editPostTitle={editPostTitle} setEditPostTitle={setEditPostTitle} editPostContent={editPostContent} setEditPostContent={setEditPostContent} isSubmitting={isSubmitting} t={t} />}
      {selectedPost && <PostModal postId={selectedPost.id} onClose={() => setSelectedPost(null)} isGuest={isGuest} />}
      {reportTarget && <ReportModal type={reportTarget.type} postId={reportTarget.postId} onClose={() => setReportTarget(null)} />}
    </div>
  );
}

// Helper modal components
function PostCreateModal({ onClose, onSubmit, postTitle, setPostTitle, postContent, setPostContent, selectedPostRoom, setSelectedPostRoom, postAttachment, setPostAttachment, postResourceLink, setPostResourceLink, postResourceLabel, setPostResourceLabel, groupedRoomOptions, isSubmitting, t }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>{t('dashboard.postModal.title')}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>
        <input type="text" placeholder={t('dashboard.postModal.titlePlaceholder')} value={postTitle} onChange={e => setPostTitle(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px" }} />
        <Select options={groupedRoomOptions} value={selectedPostRoom} onChange={setSelectedPostRoom} placeholder={t('dashboard.postModal.selectRoom')} />
        <br />
        <textarea placeholder={t('dashboard.postModal.contentPlaceholder')} value={postContent} onChange={e => setPostContent(e.target.value)} style={{ width: "100%", minHeight: "120px", padding: "10px", borderRadius: "8px", resize: "vertical" }} />
        <div style={{ marginTop: "10px" }}>
          <label>{t('dashboard.postModal.attachLabel')}</label>
          <input type="file" accept="image/*,.pdf" onChange={e => setPostAttachment(e.target.files[0])} />
        </div>
        <div style={{ marginTop: "10px" }}>
          <input type="url" placeholder={t('dashboard.postModal.resourceLinkPlaceholder')} value={postResourceLink} onChange={e => setPostResourceLink(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", marginBottom: "6px" }} />
          <input type="text" placeholder={t('dashboard.postModal.resourceLabelPlaceholder')} value={postResourceLabel} onChange={e => setPostResourceLabel(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px" }} />
        </div>
        <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
          <button onClick={onClose}>{t('dashboard.postModal.cancel')}</button>
          <button onClick={onSubmit} disabled={!postContent.trim() || !selectedPostRoom || isSubmitting}>
            {isSubmitting ? t('dashboard.postModal.posting') : t('dashboard.postModal.post')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostEditModal({ post, onClose, onSave, editPostTitle, setEditPostTitle, editPostContent, setEditPostContent, isSubmitting, t }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0 }}>{t('dashboard.postModal.editTitle')}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>
        <input type="text" value={editPostTitle} onChange={e => setEditPostTitle(e.target.value)} placeholder="Title" style={{ width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px" }} />
        <textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} placeholder="Content" style={{ width: "100%", minHeight: "120px", padding: "10px", borderRadius: "8px", resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }}>
          <button onClick={onClose} style={{ padding: "4px", width: "60px", textAlign: "center", backgroundColor: "#da2828", color: "white", borderRadius: "8px" }}>{t('dashboard.postModal.cancel')}</button>
          <button onClick={() => onSave(post.id)} disabled={isSubmitting} style={{ padding: "4px", backgroundColor: "#3ada28", color: "black", borderRadius: "8px", width: "60px", textAlign: "center" }}>
            {isSubmitting ? t('dashboard.postModal.saving') : t('dashboard.postModal.save')}
          </button>
        </div>
      </div>
    </div>
  );
}