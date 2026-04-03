import "../styles/Dash.css";
import "../styles/sidebar.css";
import Cat from "../photos/Cat.jpg";
 import { useNavigate } from "react-router-dom";
 import axios from "axios";
import Select from "react-select";
import { customSelect } from "../assets/components/selectStyles";


import { useRegistration } from "../assets/components/Context.jsx";
import "../styles/pallette.css"
import { useEffect, useState } from "react";

//dashboard too big...+i want it scalable...i'll isolate some things...
import PostModal from "../assets/components/PostModal.jsx";

import ReportModal from "../assets/components/ReportModal.jsx";

//sooooooooooo
//i'm too lazy to keep creating an account each time i want ot test something(refresh delets saved data )
//sooo why not work with both,context and localstorge?
//i meant context to creat the datashape "agreed upon" and local storage to save ot as is....
//deal?
//i imported the same thing twice and it made errors....u gotta love react...
//what are the chances that i can use don refrences in here?....
//as much as i know this would be a very bad idea....i wanna test it out....sorry sarah..i'm experementing again...
// //ignore that kind of comments..


//hheheheheheheh....since i hate my self now i can justify the pain i'm about to do....
//i'll make mokeup posts....just simple numbered blocks that appear when clicking the button to write a post ...
//this should be easy enough...but if not...then i already hate myself...maybe a nigative and a nigative will make it positive?hehehehehehe
//about a month passed...waaaaayyyy passed that....FUCK




export default function Dashboard() {
      const navigate = useNavigate();

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [user, setUser] = useState(null);



//backen posts
const [posts, setPosts] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [postContent, setPostContent] = useState("");
const [loading, setLoading] = useState(false);

const [userRooms, setUserRooms] = useState([]);
const [selectedRooms, setSelectedRooms] = useState([]);
//scroling to the top of the code just to add a usestate u didnt even know you needed is absurd and biond me at this point

const [postTitle, setPostTitle] = useState("");
const [selectedPostRoom, setSelectedPostRoom] = useState(null);
const [selectedPost, setSelectedPost] = useState(null);

const [editingPost, setEditingPost] = useState(null);
const [editPostContent, setEditPostContent] = useState("");
const [editPostTitle, setEditPostTitle] = useState("");

const [editingComment, setEditingComment] = useState(null);
const [editCommentContent, setEditCommentContent] = useState("");

//search thinggis
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState({ posts: [], users: [] });
const [showSearchDropdown, setShowSearchDropdown] = useState(false);

//this to be set to backend maybe later....but guests are not saved in database....gray hole to be patched by local storage for now
const guestToken = localStorage.getItem("guestToken");
const isGuest = !!guestToken;

//subject rooms...i coudnt run fast enough
const [showBrowseRooms, setShowBrowseRooms] = useState(false);
const [subjectRoomsData, setSubjectRoomsData] = useState([]);
const [subjectRoomsLoading, setSubjectRoomsLoading] = useState(false);


//post attachment
const [postAttachment, setPostAttachment] = useState(null);
const [postResourceLink, setPostResourceLink] = useState("");
const [postResourceLabel, setPostResourceLabel] = useState("");


const [savedPostIds, setSavedPostIds] = useState([]);

//reporting shit
const [reportTarget, setReportTarget] = useState(null);
//announcment shits
const [announcements, setAnnouncements] = useState([]);
const [showAnnouncements, setShowAnnouncements] = useState(false);

//subject room requests....
const [requestSubject, setRequestSubject] = useState("");
const [requestMajor, setRequestMajor] = useState("");
const [requestFeedback, setRequestFeedback] = useState("");
const [requestLoading, setRequestLoading] = useState(false);


/////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

  //
  // If user skipped info/register, send them back
// +for guests

useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  const guest = !!localStorage.getItem("guestToken");

  if (!storedUser && !guest) {
    navigate("/login");
    return;
  }

  if (storedUser) setUser(storedUser);
}, [navigate]);



useEffect(() => {
  //maybe if this caused problems...change with useRef of react...only if necessary...which for now..it isnt..
  const lgm = document.getElementById("lgm");
  const body = document.body;

  if (!lgm) return;

  let savedTheme = localStorage.getItem("theme");

  if (!savedTheme) {
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    savedTheme = prefersLight ? "light" : "dark";
    localStorage.setItem("theme", savedTheme);
  }

  if (savedTheme === "light") {
    body.classList.add("light-mode");
    lgm.textContent = "🌙Dark Mode ";
  } else {
    lgm.textContent = "☀️Light Mode ";
  }

  const toggleTheme = () => {
    body.classList.toggle("light-mode");
    const mode = body.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("theme", mode);
    lgm.textContent = mode === "light" ? "🌙Dark Mode " : "☀️Light Mode ";
  };

  lgm.addEventListener("click", toggleTheme);

  return () => lgm.removeEventListener("click", toggleTheme);
}, []);


//listener to the update from editprofile page
useEffect(() => {
  const updateUser = () => {
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(storedUser);
  };

  window.addEventListener("storage", updateUser);

  return () => {
    window.removeEventListener("storage", updateUser);
  };
}, []);

 const fetchRoomsAndPosts = async () => {
    console.log("fetchRoomsAndPosts called");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let allowedRooms = [];

      if (isGuest) {
        const response = await axios.get("http://localhost:5000/api/rooms/public-rooms");
        const guestUniversities = JSON.parse(localStorage.getItem("guestUniversities")) || [];
        const selectedCodes = guestUniversities.map(u => u.value);
        allowedRooms = response.data.filter(r =>
          r.type === "public" || selectedCodes.includes(r.university)
        );
      } else {
        const response = await axios.get("http://localhost:5000/api/rooms/my-rooms", {
          headers: { Authorization: `Bearer ${token}` }
        });
        allowedRooms = response.data;
      }

      setUserRooms(allowedRooms);

      //save posts/unsave...u get the idea
      if (!isGuest) {
          try {
               const savedRes = await axios.get("http://localhost:5000/api/posts/saved", {
                 headers: { Authorization: `Bearer ${token}` }
             });
            setSavedPostIds(savedRes.data.map(p => p.id));
         } catch (err) {
             console.error("Failed to fetch saved posts:", err);
       }
      }

      let url = "http://localhost:5000/api/posts";
      if (selectedRooms.length === 1) {
        url += `?roomId=${selectedRooms[0].value}`;
      }
      const postsResponse = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : 
                 guestToken ? { Authorization: `Bearer ${guestToken}` } : {}
      });

      if (isGuest) {
        const allowedRoomIds = allowedRooms.map(r => r.id);
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

////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

//ze function to(can i call it function? or component? this entire page is a compenent though...anyhow finish the comment)create mock
const handleMockPost = () => {
  setMockPosts(prev => [//objet dde post....why did i turn french? brothaa eughhhh
    {
      id: prev.length + 1,
      author: user?.username || user?.fullname || "User",
      content: `Post #${prev.length + 1}`,
      time: new Date().toLocaleTimeString()
    },
    ...prev
  ]);
};//i think the one above is extra....that is just to spam button the feed...
//this one creates a semi blivable post and WE SAVE TO LOCALSTORAGE
//the one before just creats a should have been good enough block...
//THIS WILL EMITATE WHAT THE VISION MIGHT LOOK LIKE...
const handleSubmitPost = async () => {
  if (!postContent.trim() || !selectedPostRoom) return;
  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("content", postContent);
    formData.append("title", postTitle || "Post");
    formData.append("roomId", selectedPostRoom.value);
    if (postAttachment) formData.append("attachment", postAttachment);
    if (postResourceLink.trim()) formData.append("resourceLink", postResourceLink);
    if (postResourceLabel.trim()) formData.append("resourceLabel", postResourceLabel);

    const response = await axios.post(
      "http://localhost:5000/api/posts",
      formData,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
    );

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
  }
};
 

//the ammount of bugs is bugging me.....
//me stupid used the wrong api...
//u know how i like to be extra so instead of simple select or react select i want a fancy select for room filtration?
//....about that...
const groupedRoomOptions = [
  {
    label: "Public",
    options: userRooms
      .filter(r => r.type === "public")
      .map(r => ({ value: r.id, label: r.name }))
  },
  {
    label: "University",
    options: userRooms
      .filter(r => r.type === "university")
      .map(r => ({ value: r.id, label: r.name }))
  },
  {
    label: "Majors",
    options: userRooms
      .filter(r => r.type === "major")
      .map(r => ({ value: r.id, label: r.name }))
  },
   ...userRooms
    .filter(r => r.type === "subject")
    .reduce((groups, room) => {
      const existing = groups.find(g => g.label === `${room.major} — Subjects`);
      if (existing) {
        existing.options.push({ value: room.id, label: room.name });
      } else {
        groups.push({
          label: `${room.major} — Subjects`,
          options: [{ value: room.id, label: room.name }]
        });
      }
      return groups;
    }, [])
  
].filter(group => group.options.length > 0); // remove empty groups


//ladies and gentemen.....the votes
const handleVote = async (postId, voteType) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.patch(
      `http://localhost:5000/api/posts/${postId}/vote`,
      { voteType },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // update the post in the feed without refetching everything
    setPosts(prev => prev
  .map(post => post.id === postId ? response.data : post)
  .filter(post => !post.isHidden)
);
//something is not right about the voting..
  } catch (err) {
    console.error("Failed to vote:", err);
  }
};

//room name instead of id(me was stupid again)
const getRoomName = (roomId) => {
  const room = userRooms.find(r => r.id === roomId);
  return room ? room.name : roomId;
};

//ze comments my good living organisme
//screw it...this is the last i'll do today
//even if it didnt work
const handleAddComment = async (postId) => {
  const input = document.getElementById("commentInput");
  const content = input?.value.trim();
  if (!content) return;

  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `http://localhost:5000/api/posts/${postId}/comments`,
      { content },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // refetch the post to get updated comments
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // update the post in the feed
    setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
    // update selected post
    setSelectedPost(response.data);
    input.value = "";
  } catch (err) {
    console.error("Failed to add comment:", err);
  }
};
//i friking got lost in my own code....
const handleCommentVote = async (postId, commentId, voteType) => {
  try {
    const token = localStorage.getItem("token");
    await axios.patch(
      `http://localhost:5000/api/posts/${postId}/comments/${commentId}/vote`,
      { voteType },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // refetch the post to get updated comment votes
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
    setSelectedPost(response.data);
  } catch (err) {
    console.error("Failed to vote on comment:", err);
  }
};


const handleDeletePost = async (postId) => {
  const confirm = window.confirm("Are you sure you want to delete this post?");
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

const handleEditPost = async (postId) => {
  try {
    const token = localStorage.getItem("token");
    await axios.patch(
      `http://localhost:5000/api/posts/${postId}`,
      { title: editPostTitle, content: editPostContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, title: editPostTitle, content: editPostContent, isUpdated: true }
        : p
    ));
    setEditingPost(null);
  } catch (err) {
    console.error("Failed to edit post:", err);
  }
};


const handleDeleteComment = async (postId, commentId) => {
  const confirm = window.confirm("Delete this comment?");
  if (!confirm) return;

  try {
    const token = localStorage.getItem("token");
    await axios.delete(
      `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
    setSelectedPost(response.data);
  } catch (err) {
    console.error("Failed to delete comment:", err);
  }
};



const handleEditComment = async (postId, commentId) => {
  try {
    const token = localStorage.getItem("token");
    await axios.patch(
      `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
      { content: editCommentContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const response = await axios.get(
      `http://localhost:5000/api/posts/${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPosts(prev => prev.map(p => p.id === postId ? response.data : p));
    setSelectedPost(response.data);
    setEditingComment(null);
  } catch (err) {
    console.error("Failed to edit comment:", err);
  }
};


const handleSearch = async (query) => {
  setSearchQuery(query);
  if (!query.trim()) {
    setSearchResults({ posts: [], users: [] });
    setShowSearchDropdown(false);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const authHeader = token ? { Authorization: `Bearer ${token}` } :
                       guestToken ? { Authorization: `Bearer ${guestToken}` } : {};

    const requests = [
      axios.get(`http://localhost:5000/api/posts/search?q=${query}`, {
        headers: authHeader
      })
    ];

    if (!isGuest) {
      requests.push(
        axios.get(`http://localhost:5000/api/users/search?q=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
    }

    const results = await Promise.all(requests);
    setSearchResults({ 
      posts: results[0].data, 
      users: isGuest ? [] : results[1].data 
    });
    setShowSearchDropdown(true);
  } catch (err) {
    console.error("Search failed:", err);
  }
};




const fetchSubjectRooms = async () => {
  setSubjectRoomsLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/rooms/subject-rooms", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSubjectRoomsData(res.data);
  } catch (err) {
    console.error("Failed to fetch subject rooms:", err);
  } finally {
    setSubjectRoomsLoading(false);
  }
};


const handleJoinSubjectRoom = async (roomId) => {
  try {
    const token = localStorage.getItem("token");
    await axios.post(`http://localhost:5000/api/rooms/subject-rooms/${roomId}/join`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // refetch both subject rooms and dashboard rooms
   await fetchSubjectRooms();
   await fetchRoomsAndPosts();
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong.");
  }
};


const handleCreateAndJoinSubjectRoom = async (major, subject) => {
   console.log("handleCreateAndJoinSubjectRoom called", major, subject);
  const confirm = window.confirm(`Join "${subject}" under ${major}?`);
  if (!confirm) return;
  try {
    const token = localStorage.getItem("token");
    await axios.post("http://localhost:5000/api/rooms/subject-rooms/create", 
      { major, subject },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  await  fetchSubjectRooms();
   await fetchRoomsAndPosts();
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong.");
  }
};


const handleLeaveSubjectRoom = async (roomId) => {
   console.log("handleJoinSubjectRoom called", roomId);
  const confirm = window.confirm("Are you sure you want to leave this room?");
  if (!confirm) return;
  try {
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:5000/api/rooms/subject-rooms/${roomId}/leave`, {
      headers: { Authorization: `Bearer ${token}` }
    });
   await fetchSubjectRooms();
   await fetchRoomsAndPosts();
  } catch (err) {
    console.log("full error:", err);
  console.log("response:", err.response);
    alert(err.response?.data?.message || "Something went wrong.");
  }
};



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


//announcment shit.....that damn word is long tf?
const fetchAnnouncements = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/admin/announcements");
    setAnnouncements(res.data);
  } catch (err) {
    console.error("Failed to fetch announcements:", err);
  }
};



const handleRequestSubjectRoom = async () => {
  if (!requestMajor || !requestSubject.trim()) return;
  setRequestLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://localhost:5000/api/rooms/subject-rooms/request",
      { major: requestMajor, subject: requestSubject.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRequestFeedback(res.data.message);
    setRequestSubject("");
    setRequestMajor("");
  } catch (err) {
    setRequestFeedback(err.response?.data?.message || "Something went wrong.");
  } finally {
    setRequestLoading(false);
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return (
        <div id="body5">
            
<div className="dashboard">

    {/* <!-- Sidebar --> */}
    <aside className="sidebar">
        <h2>DASHBOARD</h2>
        <ul>
            <li><a href="#" id="home-link" onClick={() => navigate("/dashboard")}>Home</a></li>
            {!isGuest && (
               <>
                  <li><a href="#" id="rooms-link" onClick={(e) => {
                      e.preventDefault();
                       setShowBrowseRooms(true);
                       fetchSubjectRooms();
                        }}>Browse Rooms</a></li>
                  <li><a href="#" onClick={() => navigate("/profile")}>Profile</a></li>
                </>
             )}
             {isGuest && (
                 <>
                    <li><a href="#" onClick={() => {
                        localStorage.removeItem("guestToken");
                        localStorage.removeItem("guestUniversities");
                         navigate("/");
                     }}>Leave Guest Mode</a></li>
                   <li><a href="#" onClick={() => {
                      localStorage.removeItem("guestToken");
                      localStorage.removeItem("guestUniversities");
                      navigate("/info");      
                        }}>Create Account</a></li>
                 </>
                )}
            {/* <li><a href="#" id="logoutBtn" onClick={() => navigate("/login")}>Logout</a></li> logout existing in both dashboard and profile was bugging me
            right now, lets just keep it in the profile....should it have a confirmation? */}
            <li><button id="lgm" className="lgm"  >☀️Light Mode </button></li>
            <li><a href="#" onClick={(e) => {
    e.preventDefault();
    fetchAnnouncements();
    setShowAnnouncements(true);
  }}>📢 Announcements</a></li>
        </ul>
    </aside>

    {/* <!-- Main content --> */}
    <main className="dashMain">
        {/* <!-- Header --> */}
        <header className="header">
           
         <h1 className="welH1">
           Welcome <span className="usernameDisplay">
           @{isGuest ? "Guest" : (user?.username || "User")} 
           <small className="tag" style={{marginLeft:"5px"}}>{isGuest ? "guest" : user?.role}</small>
           </span>
          </h1>




            <img src={user?.profilePic || Cat} alt="pfp" className="pfp" />
        </header>

        {/* why is simple css so damn hell?....was using css framwork going to make this worst or better?..guess we never gonna know */}
<section className="room-selection" style={{
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "15px"
}}>
  <div style={{ flex: 1 }}>
    <Select
      isMulti
      options={groupedRoomOptions}
      value={selectedRooms}
      onChange={(selected) => setSelectedRooms(selected || [])}
      placeholder="Select rooms to view..."
      styles={customSelect}
    />
  </div>
{/* this is gonna hurt.... */}
  <div style={{position:"relative", width:"25%"}}>
  <input 
    type="text" 
    id="dashSearch" 
    className="dashSearch" 
    placeholder="🔍 searching for something?" 
    value={searchQuery}
    onChange={(e) => handleSearch(e.target.value)}
    onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
    style={{
      width: "100%",
      border: "2px solid #8ca4c6",
      height: "38px",
      padding: "3px 8px",
      borderRadius: "6px",
      boxSizing: "border-box"
    }}
  />

  {showSearchDropdown && (
  <div style={{position:"absolute", top:"42px", left:0, right:0, background:"#2d3350", borderRadius:"8px", boxShadow:"0 4px 20px rgba(0,0,0,0.3)", zIndex:100}}>
    
    <div style={{display:"flex"}}>
      {/* posts side */}
      <div style={{flex:1, borderRight:"1px solid rgba(255,255,255,0.1)", maxHeight:"250px", overflowY:"auto"}}>
        <p style={{padding:"8px 12px", margin:0, color:"rgba(255,255,255,0.5)", fontSize:"11px", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>POSTS</p>
        {searchResults.posts.length === 0 ? (
          <p style={{padding:"12px", opacity:0.4, fontSize:"12px", textAlign:"center"}}>No posts found</p>
        ) : (
          searchResults.posts.slice(0,2).map(post => (
            <div key={post.id}
              onClick={() => { setSelectedPost(post); setShowSearchDropdown(false); setSearchQuery(""); }}
              style={{padding:"10px 12px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.05)"}}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <strong style={{fontSize:"12px", color:"white"}}>@{post.authorUsername}</strong>
              <p style={{margin:"2px 0 0", fontSize:"11px", color:"rgba(255,255,255,0.6)"}}>{post.content?.slice(0, 50)}...</p>
            </div>
          ))
        )}
      </div>

      {/* users side */}
      {!isGuest && (
      <div style={{flex:1, maxHeight:"250px", overflowY:"auto"}}>
        <p style={{padding:"8px 12px", margin:0, color:"rgba(255,255,255,0.5)", fontSize:"11px", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>USERS</p>
        {searchResults.users.length === 0 ? (
          <p style={{padding:"12px", opacity:0.4, fontSize:"12px", textAlign:"center"}}>No users found</p>
        ) : (
          searchResults.users.slice(0,2).map(u => (
            <div key={u.id}
              onClick={() => { setShowSearchDropdown(false); 
              setSearchQuery(""); 
              navigate(`/users/${u.id}`); }}
              style={{padding:"10px 12px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:"8px"}}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <img src={u.profilePic || Cat} alt="pfp" style={{width:"28px", height:"28px", borderRadius:"50%", objectFit:"cover"}}/>
              <div>
                <strong style={{fontSize:"12px", color:"white"}}>@{u.username}</strong>
                <small style={{display:"block", color:"rgba(255,255,255,0.5)", fontSize:"11px"}}>{u.role}</small>
              </div>
            </div>
          ))
        )}
      </div>
      )}
    </div>

    {/* see all results */}
    <div
      onClick={() => { setShowSearchDropdown(false); navigate(`/search?q=${searchQuery}`); }}
      style={{padding:"10px", textAlign:"center", borderTop:"1px solid rgba(255,255,255,0.1)", cursor:"pointer", color:"#8ca4c6", fontSize:"12px"}}
      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}
    >
      See all results for "{searchQuery}" →
    </div>

  </div>
)}
</div>

  <button 
    id="postBtn" 
    className="postBtn" 
    style={{
      width: "15%",
      height: "38px",
      padding: "3px",
      borderRadius: "6px",
      whiteSpace: "nowrap"
    }} 
    onClick={() => isGuest ? alert("Login to post? ") : setIsModalOpen(true)}
  >
    Write A Post📝
  </button>
</section>

        {/* <!-- Feed --> */}
        <section className="fyp-container">
            <h2 className="H2feed">Feed</h2>
            <div className="fyp-feed" id="fyp-feed">
                <p>ehh...the mock are just for funsies....this will not be at all the way this will be..i hope</p><br /><br />
                {loading ? (
  <p>Loading posts...</p>
) : posts.length === 0 ? (
  <p>No posts yet. Try writing one ✨</p>
) : (
  posts.map(post =>
     {
  if (post.isHidden) return null;
  return ( 
    
    <div key={post.id} className="mock-post" style={{border:"1px solid #ccc",borderRadius:"30%",marginBottom:"5px", padding:"14px", borderRadius:"6px"}}>
      <div style={{  display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
  <img 
    src={user?.profilePic || Cat} 
    alt="pfp" 
    style={{width:"32px", height:"32px", borderRadius:"50%", objectFit:"cover"}}
  />
  <strong>@{post.authorUsername}</strong>
  <small style={{
    background:"#6476af", 
    color:"white", 
    padding:"2px 8px", 
    borderRadius:"10px",
    fontSize:"11px"
  }}>{post.authorRole || "user"}</small>
  <small style={{opacity:0.6}}>{getRoomName(post.roomId)}</small>
</div>
      <p>{post.content}</p>
      {/* image attachment */}
{post.image && (
  <div style={{marginBottom:"8px"}}>
    <a href={post.image} target="_blank" rel="noopener noreferrer">
      <img 
        src={post.image} 
        alt="attachment" 
        style={{maxWidth:"100%", borderRadius:"8px", display:"block", cursor:"pointer"}}
      />
    </a>
    <a
      href={post.image}
      download
      style={{display:"inline-block", marginTop:"4px", fontSize:"11px", color:"#8ca4c6"}}
    >
      ⬇️ Download Image
    </a>
  </div>
)}


{/* pdf attachment */}
{post.pdf && (
  <a 
    href={post.pdf} 
    target="_blank" 
    rel="noopener noreferrer"
    style={{display:"inline-flex", alignItems:"center", gap:"6px", padding:"6px 12px", background:"rgba(16, 15, 15, 0.25)", borderRadius:"6px", color:"white", textDecoration:"none", fontSize:"13px", marginBottom:"8px"}}
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
      <small>{new Date(post.createdAt).toLocaleString()}</small>
      <div style={{marginTop: "8px"}}>
        <button onClick={() => isGuest ? alert("Create an account to vote! 👋") :handleVote(post.id, "useful")}>{post.votes.useful}👍 Useful </button>
        <button onClick={() =>isGuest ? alert("Create an account to vote! 👋") : handleVote(post.id, "useless")} style={{marginLeft: "8px"}}>{post.votes.useless}👎 Useless </button>
        <button onClick={() => setSelectedPost(post)}  style={{marginLeft: "8px"}}>
         Comments {post.comments.length}
        </button>
           {!isGuest && (
              <button
              onClick={() => handleSavePost(post.id)}
              style={{marginLeft:"8px", cursor:"pointer", color: savedPostIds.includes(post.id) ? "green" : "inherit"}}
               >
                {savedPostIds.includes(post.id) ? "🔖 Saved" : "🔖 Save"}
                </button>
                  )}

              {!isGuest && currentUser?.id !== post.authorId && (
                  <button
                   onClick={() => setReportTarget({ type: "post", postId: post.id })}
                   style={{ marginLeft: "8px", cursor: "pointer", color: "#c0392b",
                    background: "none", border: "none", fontSize: "13px" }}>
                   🚩 Report
                 </button>
                )}

        {currentUser?.id === post.authorId && (
  <button 
    onClick={() => handleDeletePost(post.id)} 
    style={{marginLeft: "8px", color:"red", cursor:"pointer"}}>
    🗑️ Delete
  </button>
  
)}
  {currentUser?.id === post.authorId && (
  <button 
    onClick={() => {
      setEditingPost(post);
      setEditPostTitle(post.title);
      setEditPostContent(post.content);
    }}  
    style={{marginLeft: "8px", color:"green", cursor:"pointer"}}>
    Edit
  </button>
  
)}
      </div>
    </div>
  )})
)}
            </div>
        </section>

    </main>
    {/* right down here we fuck around and find out */}
 {isModalOpen && (
  <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Write a Post</h3>
        <button onClick={() => setIsModalOpen(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      <input 
        type="text"
        placeholder="Title (optional)"
        value={postTitle}
        onChange={(e) => setPostTitle(e.target.value)}
        style={{width:"100%", marginBottom:"10px", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
      />

      <Select
        options={groupedRoomOptions}
        value={selectedPostRoom}
        onChange={(selected) => setSelectedPostRoom(selected)}
        placeholder="Select a room to post in..."
        styles={customSelect}
        // isMulti
      />
      <br/>

      <textarea
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        placeholder="Describe your flow..."
        style={{width:"100%", minHeight:"120px", padding:"10px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box", resize:"vertical"}}
      />

{/* //////attachment thingies.....this is gonna be messy....the football player?! */}
       {/* image/pdf attachment */}
<div style={{marginTop:"10px"}}>
  <label style={{display:"block", marginBottom:"6px", opacity:0.7, fontSize:"13px"}}>
    📎 Attach Image or PDF
  </label>
  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) => setPostAttachment(e.target.files[0])}
    style={{fontSize:"13px", color:"white"}}
  />
  {postAttachment && (
    <small style={{display:"block", marginTop:"4px", opacity:0.6}}>
      Selected: {postAttachment.name}
      <button 
        onClick={() => setPostAttachment(null)}
        style={{marginLeft:"8px", background:"none", border:"none", color:"#fc0c0c", cursor:"pointer", fontSize:"11px"}}
      >
        ✕ Remove
      </button>
    </small>
  )}
</div>

{/* resource link */}
<div style={{marginTop:"10px"}}>
  <label style={{display:"block", marginBottom:"6px", opacity:0.7, fontSize:"13px"}}>
    🔗 Resource Link (Google Drive, GitHub, etc.)
  </label>
  <input
    type="url"
    placeholder="https://..."
    value={postResourceLink}
    onChange={(e) => setPostResourceLink(e.target.value)}
    style={{width:"100%", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box", marginBottom:"6px"}}
  />
  <input
    type="text"
    placeholder="Label (optional, e.g. 'Chapter 3 Notes')"
    value={postResourceLabel}
    onChange={(e) => setPostResourceLabel(e.target.value)}
    style={{width:"100%", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
  />
</div>

      <br/><br/>

      <div className="modal-actions" style={{display:"flex", justifyContent:"flex-end", gap:"10px"}}>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
        <button onClick={handleSubmitPost} disabled={!postContent.trim() || !selectedPostRoom}>Post</button>
      </div>

    </div>
  </div>
)}


{editingPost && (
  <div className="modal-overlay" onClick={() => setEditingPost(null)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Edit Post</h3>
        <button onClick={() => setEditingPost(null)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      <input
        type="text"
        value={editPostTitle}
        onChange={(e) => setEditPostTitle(e.target.value)}
        placeholder="Title"
        style={{width:"100%", marginBottom:"10px", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box"}}
      />

      <textarea
        value={editPostContent}
        onChange={(e) => setEditPostContent(e.target.value)}
        placeholder="Content"
        style={{width:"100%", minHeight:"120px", padding:"10px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box", resize:"vertical"}}
      />

      <div style={{display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"15px"}}>
        <button onClick={() => setEditingPost(null)}>Cancel</button>
        <button onClick={() => handleEditPost(editingPost.id)}>Save</button>
      </div>

    </div>
  </div>
)}


{selectedPost && (
  <PostModal
    postId={selectedPost.id}
    onClose={() => setSelectedPost(null)}
    isGuest={isGuest}
  />
)}

{/* i seriosly need better modals.....but UI for last apperantly */}


{showBrowseRooms && (
  <div className="modal-overlay" onClick={() => setShowBrowseRooms(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxHeight:"100vh", overflowY:"auto"}}>
      
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
        <h3 style={{margin:0}}>Browse Rooms</h3>
        <button onClick={() => setShowBrowseRooms(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
      </div>

      {subjectRoomsLoading ? (
        <p style={{opacity:0.5, textAlign:"center"}}>Loading...</p>
      ) : subjectRoomsData.length === 0 ? (
        <p style={{opacity:0.5, textAlign:"center"}}>No rooms available.</p>
      ) : (
        subjectRoomsData.map(({ major, rooms, available }) => (
          <div key={major} style={{marginBottom:"20px"}}>
            <h4 style={{margin:"0 0 10px", color:"#6476af", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingBottom:"6px"}}>
              {major}
            </h4>

            {/* joined rooms */}
            {rooms.map(room => (
              <div key={room.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", marginBottom:"6px", background:"rgba(100,118,175,0.2)", borderRadius:"8px"}}>
                <span>✓ {room.name}</span>
                <button
                  onClick={() => handleLeaveSubjectRoom(room.id)}
                  style={{fontSize:"11px", padding:"3px 10px", borderRadius:"6px", background:"transparent", border:"1px solid #fc0c0c", color:"#fc0c0c", cursor:"pointer"}}
                >
                  Leave
                </button>
              </div>
            ))}

            {/* available subjects not yet created */}
            {available.map(subject => (
              <div key={subject} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", marginBottom:"6px", background:"rgba(255,255,255,0.05)", borderRadius:"8px"}}>
                <span style={{opacity:0.7}}>{subject}</span>
                <button
                  onClick={() => handleCreateAndJoinSubjectRoom(major, subject)}
                  style={{fontSize:"11px", padding:"3px 10px", borderRadius:"6px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}
                >
                  Join
                </button>
              </div>
            ))}

          </div>
        ))
      )}


       {/* request a subject room */}
<div style={{ marginTop: "24px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
  <h4 style={{ margin: "0 0 12px", opacity: 0.7, fontSize: "13px" }}>
    Can't find your subject? Request it:
  </h4>

  {/* major dropdown — only user's own majors */}
  <select
    value={requestMajor}
    onChange={(e) => { setRequestMajor(e.target.value); setRequestFeedback(""); }}
    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "#252b45", color: "white", marginBottom: "8px" }}
  >
    <option value="">Select your major...</option>
    {user?.majors?.map(m => (
      <option key={m} value={m}>{m}</option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Subject name..."
    value={requestSubject}
    onChange={(e) => { setRequestSubject(e.target.value); setRequestFeedback(""); }}
    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", boxSizing: "border-box", marginBottom: "8px" }}
  />

  {requestFeedback && (
    <p style={{ 
      margin: "0 0 8px", fontSize: "13px",
      color: requestFeedback.includes("notified") || requestFeedback.includes("submitted") ? "#27ae60" : "#e74c3c" 
    }}>
      {requestFeedback}
    </p>
  )}

  <button
    onClick={handleRequestSubjectRoom}
    disabled={!requestMajor || !requestSubject.trim() || requestLoading}
    style={{ padding: "8px 16px", borderRadius: "6px", background: "#6476af", border: "none", color: "white", cursor: "pointer", fontSize: "13px", opacity: (!requestMajor || !requestSubject.trim()) ? 0.5 : 1 }}
  >
    {requestLoading ? "Sending..." : "Send Request"}
  </button>
</div>

    </div>
   
  </div>
)}

{reportTarget && (
  <ReportModal
    type={reportTarget.type}
    postId={reportTarget.postId}
    onClose={() => setReportTarget(null)}
  />
)}


{showAnnouncements && (
  <div className="modal-overlay" onClick={() => setShowAnnouncements(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}
      style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>📢 Announcements</h3>
        <button onClick={() => setShowAnnouncements(false)}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {announcements.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: "center" }}>No announcements yet.</p>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{
              background: "#252b45", borderRadius: "10px",
              padding: "14px", marginBottom: "10px"
            }}>
              <p style={{ margin: "0 0 8px" }}>{a.message}</p>
              <small style={{ opacity: 0.5 }}>
                By @{a.createdBy} — {new Date(a.createdAt).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>

    </div>
  </div>
)}

</div>
        </div>
    );  }
      