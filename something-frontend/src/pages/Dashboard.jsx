import "../styles/Dash.css";
import "../styles/sidebar.css";
import "../styles/pallette.css";
import Cat from "../photos/Cat.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import { customSelect } from "../assets/components/selectStyles";

import { useRegistration } from "../assets/components/Context.jsx";
import "../styles/pallette.css";
import { useEffect, useState } from "react";

//dashboard too big...+i want it scalable...i'll isolate some things...screw that plan,we make the app work first
import PostModal from "../assets/components/PostModal.jsx";

import ReportModal from "../assets/components/ReportModal.jsx";

import { useTranslation } from "react-i18next";

import { useRef } from "react";
import AdminPanel from "./AdminPanel";
import SuperadminPanel from "./Superadminpanel";
import GuidePage from "./GuideComponenet.jsx";
import Profile from "./Profile";
import RoomsView from "../assets/components/RoomsView.jsx";
import logo from "../../public/apple-touch-icon.png";
import ChatTab from "./ChatTab";
import { useTheme } from "../Theme";
import api from "../api/axios.js";

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
  const { theme, setTheme } = useTheme();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [user, setUser] = useState(null);
  //////////////////////////////
  //expensive sarah
  const [activeTab, setActiveTab] = useState("feed");
  const [langPopover, setLangPopover] = useState(false);
  const langPopoverRef = useRef(null);

  const isAdmin =
    user?.authorityLevel === "admin" || user?.authorityLevel === "superadmin";
  const isSuperAdmin = user?.authorityLevel === "superadmin";
  /////////////////////////

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


  //post pagination attempt
  const [postsCursor, setPostsCursor] = useState(null); // { createdAt, id } | null
const [hasMorePosts, setHasMorePosts] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const feedEndRef = useRef(null);

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

  //sort thing....anything but the things i need
  const [sortBy, setSortBy] = useState("random");

  ///not proud of this...toggle sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const currentLang = i18n.language;

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    // document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };
  const handleSelectChange = (event) => {
    // Grabs the value ('en', 'fr', or 'ar') from the chosen option
    changeLanguage(event.target.value);
  };

  const [isLight, setIsLight] = useState(
    () => localStorage.getItem("theme") === "light",
  );




  const [editPostAttachment, setEditPostAttachment] = useState(null);
const [editPostResourceLink, setEditPostResourceLink] = useState("");
const [editPostResourceLabel, setEditPostResourceLabel] = useState("");
const [removeAttachment, setRemoveAttachment] = useState(false);


//the absurd ammount of conts.....
//either way,more consts...
//the notification shit
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const notifRef = useRef(null);

const [postIsQuestion, setPostIsQuestion] = useState(false);

// ....................................i hate me .....
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

  // useEffect(() => {
  //   //maybe if this caused problems...change with useRef of react...only if necessary...which for now..it isnt..
  //   const lgm = document.getElementById("lgm");
  //   const body = document.body;

  //   if (!lgm) return;

  //   let savedTheme = localStorage.getItem("theme");

  //   if (!savedTheme) {
  //     const prefersLight = window.matchMedia(
  //       "(prefers-color-scheme: light)",
  //     ).matches;
  //     savedTheme = prefersLight ? "light" : "dark";
  //     localStorage.setItem("theme", savedTheme);
  //   }

  //   if (savedTheme === "light") {
  //     body.classList.add("light-mode");
  //     lgm.textContent = t('dashboard.sidebar.darkMode');
  //   } else {
  //     lgm.textContent = t('dashboard.sidebar.lightMode');
  //   }

  //   const toggleTheme = () => {
  //     body.classList.toggle("light-mode");
  //     const mode = body.classList.contains("light-mode") ? "light" : "dark";
  //     localStorage.setItem("theme", mode);
  //     lgm.textContent = mode === "light" ? t('dashboard.sidebar.darkMode') : t('dashboard.sidebar.lightMode');
  //   };

  //   lgm.addEventListener("click", toggleTheme);

  //   return () => lgm.removeEventListener("click", toggleTheme);
  // }, []);

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

//   const fetchRoomsAndPosts = async () => {
//     console.log("fetchRoomsAndPosts called");

//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       let allowedRooms = [];

//       if (isGuest) {
//         // const response = await axios.get(
//         //   "http://localhost:5000/api/rooms/public-rooms",
//         // );
//         const response = await api.get("/rooms/public-rooms");
//         const guestUniversities =
//           JSON.parse(localStorage.getItem("guestUniversities")) || [];
//         const selectedCodes = guestUniversities.map((u) => u.value);
//         allowedRooms = response.data.filter(
//           (r) =>
//             r.type === "public" || selectedCodes.includes(r.universityCode),
//         );
//       } else {
//         // const response = await axios.get(
//         //   "http://localhost:5000/api/rooms/my-rooms",
//         //   {
//         //     headers: { Authorization: `Bearer ${token}` },
//         //   },
//         // );
//         const response = await api.get("/rooms/my-rooms");
//         allowedRooms = response.data;
//       }

//       setUserRooms(allowedRooms);

//       //save posts/unsave...u get the idea
//       if (!isGuest) {
//         try {
//           // const savedRes = await axios.get(
//           //   "http://localhost:5000/api/posts/saved",
//           //   {
//           //     headers: { Authorization: `Bearer ${token}` },
//           //   },
//           // );
//           const savedRes = await api.get("/posts/saved");
//           setSavedPostIds(savedRes.data.map((p) => p.id));
//         } catch (err) {
//           console.error("Failed to fetch saved posts:", err);
//         }
//       }

//       // let url = "http://localhost:5000/api/posts";
//       let url = "/posts";
//       if (selectedRooms.length === 1) {
//         url += `?roomId=${selectedRooms[0].value}`;
//       }
//       // const postsResponse = await axios.get(url, {
//       //   headers: token
//       //     ? { Authorization: `Bearer ${token}` }
//       //     : guestToken
//       //       ? { Authorization: `Bearer ${guestToken}` }
//       //       : {},
//       // });
//       const postsResponse = await api.get(url, {
//   headers: isGuest && guestToken ? { Authorization: `Bearer ${guestToken}` } : {}
// });

//       if (isGuest) {
//         const allowedRoomIds = allowedRooms.map((r) => r.id);
//         setPosts(
//           postsResponse.data.filter((p) => allowedRoomIds.includes(p.roomId)),
//         );
//       } else {
//         const publicPosts = postsResponse.data.filter((p) => {
//           if (!p.roomId) return false;
//           const room = allowedRooms.find((r) => r.id === p.roomId);
//           return room ? room.type !== "private" : false;
//         });

//         setPosts(publicPosts);
//         console.log(
//           "post sample userVote:",
//           publicPosts[0]?.userVote,
//           publicPosts[0],
//         );
//       }
//     } catch (err) {
//       console.error("Failed to fetch:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
const fetchRoomsAndPosts = async () => {
  console.log("fetchRoomsAndPosts called");
  setLoading(true);
  try {
    let allowedRooms = [];

    if (isGuest) {
      const response = await api.get("/rooms/public-rooms");
      const guestUniversities = JSON.parse(localStorage.getItem("guestUniversities")) || [];
      const selectedCodes = guestUniversities.map((u) => u.value);
      allowedRooms = response.data.filter(
        (r) => r.type === "public" || selectedCodes.includes(r.universityCode),
      );
    } else {
      const response = await api.get("/rooms/my-rooms");
      allowedRooms = response.data;
    }

    setUserRooms(allowedRooms);

    if (!isGuest) {
      try {
        const savedRes = await api.get("/posts/saved");
        setSavedPostIds(savedRes.data.map((p) => p.id));
      } catch (err) {
        console.error("Failed to fetch saved posts:", err);
      }
    }

    // reset pagination and load the first page
    setPostsCursor(null);
    setHasMorePosts(true);
    await fetchPosts(true, allowedRooms);
  } catch (err) {
    console.error("Failed to fetch:", err);
    setLoading(false);
  }
};

const fetchPosts = async (reset = false, roomsOverride = null) => {
  const rooms = roomsOverride || userRooms;

  if (reset) {
    setLoading(true);
  } else {
    if (!hasMorePosts || loadingMore) return;
    setLoadingMore(true);
  }

  try {
    const params = new URLSearchParams();
    if (selectedRooms.length === 1) params.append("roomId", selectedRooms[0].value);
    params.append("limit", "20");
    if (!reset && postsCursor) {
      params.append("cursorCreatedAt", postsCursor.createdAt);
      params.append("cursorId", postsCursor.id);
    }

    const response = await api.get(`/posts?${params.toString()}`, {
      headers: isGuest && guestToken ? { Authorization: `Bearer ${guestToken}` } : {},
    });

    const { posts: fetchedPosts, nextCursor, hasMore } = response.data;

    let visiblePosts;
    if (isGuest) {
      const allowedRoomIds = rooms.map((r) => r.id);
      visiblePosts = fetchedPosts.filter((p) => allowedRoomIds.includes(p.roomId));
    } else {
      visiblePosts = fetchedPosts.filter((p) => {
        if (!p.roomId) return false;
        const room = rooms.find((r) => r.id === p.roomId);
        return room ? room.type !== "private" : false;
      });
    }

    setPosts((prev) => (reset ? visiblePosts : [...prev, ...visiblePosts]));
    setPostsCursor(nextCursor);
    setHasMorePosts(hasMore);
  } catch (err) {
    console.error("Failed to fetch posts:", err);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};

  useEffect(() => {
    fetchRoomsAndPosts();
  }, [selectedRooms]);


const loadMoreRef = useRef(() => {});

useEffect(() => {
  loadMoreRef.current = () => fetchPosts(false);
}); // no deps — runs every render, always fresh

useEffect(() => {
  const sentinel = feedEndRef.current;
  if (!sentinel) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMoreRef.current();
    },
    { rootMargin: "300px" },
  );
  observer.observe(sentinel);
  return () => observer.disconnect();
}, []);

  useEffect(() => {
  if (isGuest) return; // guests have no notifications

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  fetchNotifications(); // immediate on mount
  const interval = setInterval(fetchNotifications, 30000); // then every 30s
  return () => clearInterval(interval);
}, [isGuest]);
/////////////////////////////////////////////////////////////////////////////

useEffect(() => {
  const handleClickOutside = (e) => {
    if (langPopoverRef.current && !langPopoverRef.current.contains(e.target)) {
      setLangPopover(false);
    }
    if (notifRef.current && !notifRef.current.contains(e.target)) {
      setShowNotifications(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////

  //ze function to(can i call it function? or component? this entire page is a compenent though...anyhow finish the comment)create mock
  const handleMockPost = () => {
    setMockPosts((prev) => [
      //objet dde post....why did i turn french? brothaa eughhhh
      {
        id: prev.length + 1,
        author: user?.username || user?.fullname || "User",
        content: `Post #${prev.length + 1}`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  }; //i think the one above is extra....that is just to spam button the feed...
  //this one creates a semi blivable post and WE SAVE TO LOCALSTORAGE
  //the one before just creats a should have been good enough block...
  //THIS WILL EMITATE WHAT THE VISION MIGHT LOOK LIKE...
  const handleSubmitPost = async () => {
    if (!postContent.trim() || !selectedPostRoom) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("title", postTitle || "Post");
      formData.append("roomId", selectedPostRoom.value);
      formData.append("isQuestion", postIsQuestion);
      if (postAttachment) formData.append("attachment", postAttachment);
      if (postResourceLink.trim())
        formData.append("resourceLink", postResourceLink);
      if (postResourceLabel.trim())
        formData.append("resourceLabel", postResourceLabel);

      // const response = await axios.post(
      //   "http://localhost:5000/api/posts",
      //   formData,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       "Content-Type": "multipart/form-data",
      //     },
      //   },
      // );

      const response = await api.post("/posts", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

      setPosts((prev) => [response.data, ...prev]);
      setPostContent("");
      setPostTitle("");
      setSelectedPostRoom(null);
      setPostAttachment(null);
      setPostResourceLink("");
      setPostResourceLabel("");
      setIsModalOpen(false);
      setPostIsQuestion(false);
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsSubmitting(false);
    }
  //  console.log(posts[0].createdAt);
  };

  //the ammount of bugs is bugging me.....
  //me stupid used the wrong api...
  //u know how i like to be extra so instead of simple select or react select i want a fancy select for room filtration?
  //....about that...
  const groupedRoomOptions = [
    {
      label: "Public",
      options: userRooms
        .filter((r) => r.type === "public")
        .map((r) => ({ value: r.id, label: r.name })),
    },
    {
      label: "University",
      options: userRooms
        .filter((r) => r.type === "university")
        .map((r) => ({ value: r.id, label: r.name })),
    },
    {
      label: "Majors",
      options: userRooms
        .filter((r) => r.type === "major")
        .map((r) => ({ value: r.id, label: r.name })),
    },
    ...userRooms
      .filter((r) => r.type === "subject")
      .reduce((groups, room) => {
        const label = "Subjects";
        const existing = groups.find((g) => g.label === label);
        if (existing) {
          existing.options.push({ value: room.id, label: room.name });
        } else {
          groups.push({
            label,
            options: [{ value: room.id, label: room.name }],
          });
        }
        return groups;
      }, []),
  ].filter((group) => group.options.length > 0); // remove empty groups

  //ladies and gentemen.....the votes
  // const handleVote = async (postId, voteType) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     await axios.patch(
  //       `http://localhost:5000/api/posts/${postId}/vote`,
  //       { voteType },
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     );
  //     const response = await axios.get(
  //       `http://localhost:5000/api/posts/${postId}`,
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     );
  //     setPosts((prev) =>
  //       prev
  //         .map((post) => (post.id === postId ? response.data : post))
  //         .filter((post) => !post.isHidden),
  //     );
  //   } catch (err) {
  //     console.error("Failed to vote:", err);
  //   }
  // };

  const handleVote = async (postId, voteType) => {
    const previousPosts = posts;

    const currentVote = posts.find((p) => p.id === postId)?.userVote;
    const alreadyVoted = currentVote === voteType;

    // instant UI update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          voteUseful:
            voteType === "useful"
              ? Number(post.voteUseful) + (alreadyVoted ? -1 : 1)
              : Number(post.voteUseful) - (currentVote === "useful" ? 1 : 0),
          voteUseless:
            voteType === "useless"
              ? Number(post.voteUseless) + (alreadyVoted ? -1 : 1)
              : Number(post.voteUseless) - (currentVote === "useless" ? 1 : 0),
          userVote: alreadyVoted ? null : voteType,
        };
      }),
    );

    try {
      const token = localStorage.getItem("token");
      // await axios.patch(
      //   `http://localhost:5000/api/posts/${postId}/vote`,
      //   { voteType },
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      await api.patch(`/posts/${postId}/vote`, { voteType });
      // sync real counts from backend
      // const response = await axios.get(
      //   `http://localhost:5000/api/posts/${postId}`,
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      const response = await api.get(`/posts/${postId}`);
      setPosts((prev) =>
        prev
          .map((p) => (p.id === postId ? { ...response.data } : p))
          .filter((p) => !p.isHidden),
      );
    } catch (err) {
      console.error("Failed to vote:", err);
      setPosts(previousPosts); // roll back on failure
    }
  };

  //room name instead of id(me was stupid again)
  const getRoomName = (roomId) => {
    const room = userRooms.find((r) => r.id === roomId);
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
      // await axios.post(
      //   `http://localhost:5000/api/posts/${postId}/comments`,
      //   { content },
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );

      // // refetch the post to get updated comments
      // const response = await axios.get(
      //   `http://localhost:5000/api/posts/${postId}`,
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );

      await api.post(`/posts/${postId}/comments`, { content });
const response = await api.get(`/posts/${postId}`);
      // update the post in the feed
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? response.data : p)),
      );
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
      // await axios.patch(
      //   `http://localhost:5000/api/posts/${postId}/comments/${commentId}/vote`,
      //   { voteType },
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );

      // // refetch the post to get updated comment votes
      // const response = await axios.get(
      //   `http://localhost:5000/api/posts/${postId}`,
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      await api.patch(`/posts/${postId}/comments/${commentId}/vote`, { voteType });
const response = await api.get(`/posts/${postId}`);

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? response.data : p)),
      );
      setSelectedPost(response.data);
    } catch (err) {
      console.error("Failed to vote on comment:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    const confirm = window.confirm(t("dashboard.post.deleteConfirm"));

    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      // await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

 const handleEditPost = async (postId) => {
  setIsSubmitting(true);
  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("title", editPostTitle);
    formData.append("content", editPostContent);
    formData.append("isQuestion", editingPost.isQuestion);
    if (editPostAttachment) formData.append("attachment", editPostAttachment);
    if (editPostResourceLink.trim()) formData.append("resourceLink", editPostResourceLink);
    if (editPostResourceLabel.trim()) formData.append("resourceLabel", editPostResourceLabel);
    if (removeAttachment) formData.append("removeAttachment", "true");

    // const response = await axios.patch(
    //   `http://localhost:5000/api/posts/${postId}`,
    //   formData,
    //   { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
    // );

    const response = await api.patch(`/posts/${postId}`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...response.data } : p));
    setEditingPost(null);
    setEditPostAttachment(null);
    setEditPostResourceLink("");
    setEditPostResourceLabel("");
    setRemoveAttachment(false);
  } catch (err) {
    console.error("Failed to edit post:", err);
  } finally {
    setIsSubmitting(false);
  }
};
  const handleDeleteComment = async (postId, commentId) => {
    const confirm = window.confirm(t("dashboard.comments.deleteConfirm"));
    if (!confirm) return;

    try {
       const token = localStorage.getItem("token");
      // await axios.delete(
      //   `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      // const response = await axios.get(
      //   `http://localhost:5000/api/posts/${postId}`,
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      await api.delete(`/posts/${postId}/comments/${commentId}`);
const response = await api.get(`/posts/${postId}`);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? response.data : p)),
      );
      setSelectedPost(response.data);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const handleEditComment = async (postId, commentId) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // await axios.patch(
      //   `http://localhost:5000/api/posts/${postId}/comments/${commentId}`,
      //   { content: editCommentContent },
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      // const response = await axios.get(
      //   `http://localhost:5000/api/posts/${postId}`,
      //   { headers: { Authorization: `Bearer ${token}` } },
      // );
      await api.patch(`/posts/${postId}/comments/${commentId}`, { content: editCommentContent });
const response = await api.get(`/posts/${postId}`);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? response.data : p)),
      );
      setSelectedPost(response.data);
      setEditingComment(null);
    } catch (err) {
      console.error("Failed to edit comment:", err);
    } finally {
      setIsSubmitting(false);
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
      const authHeader = token
        ? { Authorization: `Bearer ${token}` }
        : guestToken
          ? { Authorization: `Bearer ${guestToken}` }
          : {};

      const requests = [
        // axios.get(`http://localhost:5000/api/posts/search?q=${query}`, {
        //   headers: authHeader,
        // }),
        api.get(`/posts/search?q=${query}`, {
  headers: isGuest && guestToken ? { Authorization: `Bearer ${guestToken}` } : {}
}),
      ];

      if (!isGuest) {
        requests.push(
          // axios.get(`http://localhost:5000/api/users/search?q=${query}`, 
          //   {
          //   headers: { Authorization: `Bearer ${token}` },
          // }),
          api.get(`/users/search?q=${query}`),

        );
      }

      const results = await Promise.all(requests);
      setSearchResults({
        posts: results[0].data,
        users: isGuest ? [] : results[1].data,
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
      // const res = await axios.get(
      //   "http://localhost:5000/api/rooms/subject-rooms",
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   },
      // );
      const res = await api.get("/rooms/subject-rooms");
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
      // await axios.post(
      //   `http://localhost:5000/api/rooms/subject-rooms/${roomId}/join`,
      //   {},
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   },
      // );
      await api.post(`/rooms/subject-rooms/${roomId}/join`, {});
      // refetch both subject rooms and dashboard rooms
      await fetchSubjectRooms();
      await fetchRoomsAndPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  // const handleCreateAndJoinSubjectRoom = async (major, majorId, subject) => {
  //   console.log("handleCreateAndJoinSubjectRoom called", major, subject);
  //   const confirm = window.confirm(
  //     t("dashboard.browseRooms.joinConfirm", { subject, major }),
  //   );
  //   if (!confirm) return;
  //   try {
  //     const token = localStorage.getItem("token");
  //     await axios.post(
  //       "http://localhost:5000/api/rooms/subject-rooms/create",
  //       { majorId, subject },
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     );

  //     await fetchSubjectRooms();
  //     await fetchRoomsAndPosts();
  //   } catch (err) {
  //     alert(err.response?.data?.message || "Something went wrong.");
  //   }
  // };

 const handleCreateAndJoinSubjectRoom = async (major, majorId, subject) => {
  const confirm = window.confirm(
    t("dashboard.browseRooms.joinConfirm", { subject, major })
  );
  if (!confirm) return;
  try {
    const token = localStorage.getItem("token");
    // const res = await axios.post(
    //   "http://localhost:5000/api/rooms/subject-rooms/create",
    //   { majorId, subject },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );
    const res = await api.post("/rooms/subject-rooms/create", { majorId, subject });

    // check what your backend actually returns
    console.log("create room response:", res.data);

    const newRoom = res.data.room ?? res.data; // adjust based on console output
    if (!newRoom?.id) {
      // backend didn't return a room object, fall back to refetch
      await fetchSubjectRooms();
      await fetchRoomsAndPosts();
      return;
    }

    setUserRooms(prev => {
      if (prev.find(r => r.id === newRoom.id)) return prev;
      return [...prev, newRoom];
    });

    setSubjectRoomsData(prev =>
      prev.map(group => {
        if (group.major !== major) return group;
        if (group.rooms.find(r => r.id === newRoom.id)) return group;
        return {
          ...group,
          rooms: [...group.rooms, newRoom],
          available: group.available.filter(
            s => s.toLowerCase() !== subject.toLowerCase()
          ),
        };
      })
    );
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong.");
  }
};
  // const handleLeaveSubjectRoom = async (roomId) => {
  //   console.log("handleJoinSubjectRoom called", roomId);
  //   const confirm = window.confirm(t("dashboard.browseRooms.leaveConfirm"));
  //   if (!confirm) return;
  //   try {
  //     const token = localStorage.getItem("token");
  //     await axios.delete(
  //       `http://localhost:5000/api/rooms/subject-rooms/${roomId}/leave`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       },
  //     );
  //     await fetchSubjectRooms();
  //     await fetchRoomsAndPosts();
  //   } catch (err) {
  //     console.log("full error:", err);
  //     console.log("response:", err.response);
  //     alert(err.response?.data?.message || "Something went wrong.");
  //   }
  // };

  const handleLeaveSubjectRoom = async (roomId) => {
  const confirm = window.confirm(t("dashboard.browseRooms.leaveConfirm"));
  if (!confirm) return;
  try {
    const token = localStorage.getItem("token");
    // await axios.delete(
    //   `http://localhost:5000/api/rooms/subject-rooms/${roomId}/leave`,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );
    await api.delete(`/rooms/subject-rooms/${roomId}/leave`);

    // 1. Remove from userRooms
    const leftRoom = userRooms.find(r => r.id === roomId);
    setUserRooms(prev => prev.filter(r => r.id !== roomId));

    // 2. Move room back from rooms → available in subjectRoomsData
    if (leftRoom) {
      setSubjectRoomsData(prev =>
        prev.map(group => {
          const wasInGroup = group.rooms.find(r => r.id === roomId);
          if (!wasInGroup) return group;
          return {
            ...group,
            rooms: group.rooms.filter(r => r.id !== roomId),
            available: [...group.available, leftRoom.name],
          };
        })
      );
    }
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong.");
  }
};

  const handleSavePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      if (savedPostIds.includes(postId)) {
        // await axios.delete(`http://localhost:5000/api/posts/${postId}/save`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        await api.delete(`/posts/${postId}/save`);
        setSavedPostIds((prev) => prev.filter((id) => id !== postId));
      } else {
        // await axios.post(
        //   `http://localhost:5000/api/posts/${postId}/save`,
        //   {},
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   },
        // );
        await api.post(`/posts/${postId}/save`, {});
        setSavedPostIds((prev) => [...prev, postId]);
      }
    } catch (err) {
      console.error("Failed to save/unsave post:", err);
    }
  };

  //announcment shit.....that damn word is long tf?
  const fetchAnnouncements = async () => {
    try {
      // const res = await axios.get(
      //   "http://localhost:5000/api/admin/announcements",
      // );
      const res = await api.get("/admin/announcements");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    }
  };

  // const handleRequestSubjectRoom = async () => {
  //   if (!requestMajor || !requestSubject.trim()) return;
  //   setRequestLoading(true);
  //   try {
  //     const token = localStorage.getItem("token");
  //     const res = await axios.post(
  //       "http://localhost:5000/api/rooms/subject-rooms/request",
  //       // { major: requestMajor, subject: requestSubject.trim() },
  //       { majorId: requestMajor, subject: requestSubject.trim() },
  //       { headers: { Authorization: `Bearer ${token}` } },
  //     );
  //     setRequestFeedback(res.data.message);
  //     setRequestSubject("");
  //     setRequestMajor("");
  //   } catch (err) {
  //     setRequestFeedback(
  //       err.response?.data?.message || "Something went wrong.",
  //     );
  //   } finally {
  //     setRequestLoading(false);
  //   }
  // };

  const handleRequestSubjectRoom = async () => {
  if (!requestMajor || !requestSubject.trim()) return;
  setRequestLoading(true);
  try {
    const token = localStorage.getItem("token");
    // const res = await axios.post(
    //   "http://localhost:5000/api/rooms/subject-rooms/request",
    //   { majorId: requestMajor, subject: requestSubject.trim() },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );
    const res = await api.post("/rooms/subject-rooms/request", { majorId: requestMajor, subject: requestSubject.trim() });

    // superadmin gets room created immediately — res.data.room will exist
    if (res.data.room) {
      const newRoom = res.data.room;

      // find the major name from subjectRoomsData to match the group
      const majorGroup = subjectRoomsData.find(
        g => String(g.majorId) === String(requestMajor)
      );
      const majorName = majorGroup?.major;

      // 1. Add to userRooms instantly
      setUserRooms(prev => {
        if (prev.find(r => r.id === newRoom.id)) return prev;
        return [...prev, newRoom];
      });

      // 2. Add to browse list under correct major group
      if (majorName) {
        setSubjectRoomsData(prev =>
          prev.map(group => {
            if (group.major !== majorName) return group;
            if (group.rooms.find(r => r.id === newRoom.id)) return group;
            return {
              ...group,
              rooms: [...group.rooms, newRoom],
              available: group.available.filter(
                s => s.toLowerCase() !== requestSubject.trim().toLowerCase()
              ),
            };
          })
        );
      }
    }

    setRequestFeedback(res.data.message);
    setRequestSubject("");
    setRequestMajor("");
  } catch (err) {
    setRequestFeedback(err.response?.data?.message || "Something went wrong.");
  } finally {
    setRequestLoading(false);
  }
};

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "recent")
      return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "popular")
      return b.voteUseful - b.voteUseless - (a.voteUseful - a.voteUseless);
    return 0; // random = no sort, just as fetched
  });


//the notificaton click
const handleNotifClick = (n) => {
  api.patch(`/notifications/${n.id}/read`).catch(() => {});
  setNotifications(prev =>
    prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)
  );
  setShowNotifications(false);

  switch (n.type) {
    case 'new_message':
    case 'room_invite':
      if (n.roomId) navigate(`/rooms/${n.roomId}`);
      break;

    case 'announcement':
      fetchAnnouncements();
      setShowAnnouncements(true);
      break;

    case 'new_post':
    case 'post_reply':
    case 'comment_reply':
      setActiveTab('feed');
      setSelectedPost({ id: n.entityId });
      break;

    case 'room_suspended':
      break;

    default:
      break;
  }
};


  const cSelect = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "transparent",
      border: "2px solid rgba(255, 255, 255, 0.68)",
      borderRadius: "12px",
      padding: "4px",
      transition: "all 0.2s ease",
      minHeight: "10px",
      fontSize: "16px",
      boxShadow: "none",
      width: "80%",
      height: "40px",

      "&:hover": {
        border: "2px solid rgba(255,255,255,0.6)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#1e2a3a",
      borderRadius: "12px",
      overflow: "hidden",
      fontSize: "16px",
      border: "1px solid rgba(255,255,255,0.1)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#4a5568"
        : state.isFocused
          ? "#2d3748"
          : "transparent",
      color: "#ffffff",
      cursor: "pointer",
      padding: "10px",
    }),
    groupHeading: (provided) => ({
      ...provided,
      color: "#a0aec0",
      fontSize: "11px",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "1px",
      padding: "8px 12px 4px",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#4a5568",
      borderRadius: "8px",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "rgba(0, 0, 0, 0.8)",
    }),
    input: (provided) => ({
      ...provided,
      color: "#ffffff",
    }),
    valueContainer: (provided) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
    }),
  };

  //changes for dashboard....
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [expanded, setExpanded] = useState(false);
  const LIMIT = 251;


  const handlePostUpdated = (updatedPost) => {
  setPosts((prev) =>
    prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
  );
};

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <div id="body5">
      {/* ── NAVBAR ── */}
      <nav className="dash-navbar" dir={isRTL ? "rtl" : "ltr"}>
        {/* Left: tabs */}
        <div className="nav-tabs">
          {!isGuest && (
            <>
              <img src={logo} alt="Logo" className="navLogo" />
              <button
                className={`nav-tab ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                {t("dashboard.nav.chat")}
              </button>
            </>
          )}

          <button
            className={`nav-tab ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => setActiveTab("feed")}
          >
            {t("dashboard.nav.feed")}
          </button>

          {!isGuest && (
            <button
              className={`nav-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              {t("dashboard.nav.profile")}
            </button>
          )}

          {!isGuest && (
            <button
              className={`nav-tab ${activeTab === "rooms" ? "active" : ""}`}
              onClick={() => setActiveTab("rooms")}
            >
              {t("dashboard.nav.rooms")}
            </button>
          )}

          {isAdmin && (
            <button
              className={`nav-tab ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              {t("dashboard.nav.admin")}
            </button>
          )}

          {isSuperAdmin && (
            <button
              className={`nav-tab ${activeTab === "superadmin" ? "active" : ""}`}
              onClick={() => setActiveTab("superadmin")}
            >
              {t("dashboard.nav.superadmin")}
            </button>
          )}

          <button
            className={`nav-tab ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            {t("dashboard.nav.guide")}
          </button>

          {isGuest && (
            <button
              style={{
                fontSize: "14px",
                padding: "6px 10px",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              className="nav-action-btn"
              title={t("dashboard.sidebar.create")}
              onClick={() => {
                navigate("/info");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("token");
                localStorage.removeItem("guestToken");
                localStorage.removeItem("guestUniversities");

              }}
            >
              {t("dashboard.sidebar.create")}
            </button>
          )}
          {isGuest && (
            <button
              style={{
                fontSize: "14px",
                padding: "6px 10px",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
              className="nav-action-btn"
              title={t("dashboard.sidebar.leave")}
              onClick={() => {
                navigate("/");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("token");
                localStorage.removeItem("guestToken");
                localStorage.removeItem("guestUniversities");
              }}
            >
              {t("dashboard.sidebar.leave")}
            </button>
          )}
        </div>

        {/* Right: action buttons + pfp */}
        <div className="nav-actions">
          {/* Announcements */}
          <button
            className="nav-action-btn"
            title={t("dashboard.sidebar.announcements")}
            onClick={() => {
              fetchAnnouncements();
              setShowAnnouncements(true);
            }}
          >
            📣
          </button>
         

          {/* Language popover */}
          <div style={{ position: "relative" }} ref={langPopoverRef}>
            <button
              className="nav-action-btn"
              title={t("dashboard.nav.language")}
              onClick={() => setLangPopover((p) => !p)}
            >
              🌐
            </button>
            {langPopover && (
              <div className="lang-popover">
                {[
                  { code: "en", label: "English" },
                  { code: "fr", label: "Français" },
                  { code: "ar", label: "العربية" },
                ].map(({ code, label }) => (
                  <div
                    key={code}
                    className={`lang-option ${currentLang === code ? "active" : ""}`}
                    onClick={() => {
                      changeLanguage(code);
                      setLangPopover(false);
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            className="nav-action-btn"
            title={
              isLight
                ? t("dashboard.sidebar.darkMode")
                : t("dashboard.sidebar.lightMode")
            }
            onClick={() => {
              document.body.classList.toggle("light-mode");
              const mode = document.body.classList.contains("light-mode")
                ? "light"
                : "dark";
              localStorage.setItem("theme", mode);
              setIsLight(mode === "light");
              setTheme(theme === "dark" ? "light" : "dark")
            }}
          >
            {isLight ? "🌙" : "☀️"}
          </button>
           {!isGuest && (
  <div style={{ position: "relative" }} ref={notifRef}>
    <button
      className="nav-action-btn"
      title="Notifications"
      onClick={(e) => {e.stopPropagation(); 
        setShowNotifications(p => !p);
        if (!showNotifications && unreadCount > 0) {
          api.patch('/notifications/read-all').catch(() => {});
          setUnreadCount(0);
        }
      }}
      style={{ position: "relative" }}
    >
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          background: "#e74c3c",
          color: "white",
          borderRadius: "50%",
          fontSize: "10px",
          width: "16px",
          height: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>

    {showNotifications && (
      <div style={{
        position: "absolute",
        top: "36px",
        right: 0,
        width: "500px",
        maxHeight: "500px",
        overflowY: "auto",
        background: "#1e2a3a",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.1)",
        zIndex: 200,
      }}
       onClick={e => e.stopPropagation()}
       >
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          fontSize: "13px",
          fontWeight: "bold",
          color: "rgba(255,255,255,0.7)",
        }}>
          Notifications
        </div>

        {notifications.length === 0 ? (
          <p style={{ padding: "16px", textAlign: "center", opacity: 0.4, fontSize: "13px" }}>
            Nothing here yet
          </p>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: n.isRead ? "transparent" : "rgba(100,118,175,0.15)",
                cursor: "pointer",
              }}
//              onClick={() => {
//                 console.log('notif clicked:', n.type, n.roomId, n); // add this
//   api.patch(`/notifications/${n.id}/read`).catch(() => {});
//   setNotifications(prev =>
//     prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)
//   );
//    setActiveTab("feed");
//   setShowNotifications(false);
// }}
onClick={() => {
  // console.log('keys:', Object.keys(n));
  // console.log('entity_id:', n.entity_id, 'entityId:', n.entityId);
  // console.log('room_id:', n.room_id, 'roomId:', n.roomId);
  handleNotifClick(n);
}}
            >
              <div style={{ fontSize: "13px", color: "white", marginBottom: "4px" }}>
                <strong>{n.title}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                {n.body}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    )}
  </div>
)}
        </div>
      </nav>

      {/* ── TAB CONTENT ── */}
      <div className="tab-content">
        {/* FEED TAB */}
        {activeTab === "feed" && (
          <main className="dashMain">
            {/* welcome header */}
            <header className="header" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className="welH1">
                {t("dashboard.header.welcome")}{" "}
                <span className="usernameDisplay">
                  @
                  {isGuest
                    ? t("dashboard.header.guest")
                    : user?.username || "User"}
                  <small className="tag" style={{ marginLeft: "5px" }}>
                    {isGuest ? t("dashboard.header.guestTag") : user?.role}
                  </small>
                </span>
              </h3>
              {/* PFP — navigates to profile tab */}
              <img
                src={user?.profilePicUrl || Cat}
                alt="pfp"
                className="pfp nav-pfp"
                onClick={() => !isGuest && setActiveTab("profile")}
                style={{ cursor: "pointer" }}
              />
            </header>

            {/* room select + search + post button */}
            <section
              className="room-selection"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "7px",
              }}
            >
              <div style={{ flex: 1 }}>
                <Select
                  isMulti
                  options={groupedRoomOptions}
                  value={selectedRooms}
                  onChange={(selected) => setSelectedRooms(selected || [])}
                  placeholder={t("dashboard.feed.selectRooms")}
                  styles={cSelect}
                />
              </div>

              <div style={{ position: "relative", width: "35%" }}>
                <input
                  type="text"
                  id="dashSearch"
                  className="dashSearch"
                  placeholder={t("dashboard.feed.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onBlur={() =>
                    setTimeout(() => setShowSearchDropdown(false), 200)
                  }
                  style={{
                    width: "100%",
                    border: "2px solid #8ca4c6",
                    height: "38px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    boxSizing: "border-box",
                  }}
                />

                {showSearchDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "42px",
                      left: 0,
                      right: 0,
                      background: "#2d3350",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      zIndex: 100,
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      {/* posts side */}
                      <div
                        style={{
                          flex: 1,
                          borderRight: "1px solid rgba(255,255,255,0.1)",
                          maxHeight: "250px",
                          overflowY: "auto",
                        }}
                      >
                        <p
                          style={{
                            padding: "8px 12px",
                            margin: 0,
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "11px",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {t("dashboard.search.posts")}
                        </p>
                        {searchResults.posts.length === 0 ? (
                          <p
                            style={{
                              padding: "12px",
                              opacity: 0.4,
                              fontSize: "12px",
                              textAlign: "center",
                            }}
                          >
                            {t("dashboard.search.noPostsFound")}
                          </p>
                        ) : (
                          searchResults.posts.slice(0, 2).map((post) => (
                            <div
                              key={post.id}
                              onClick={() => {
                                setSelectedPost(post);
                                setShowSearchDropdown(false);
                                setSearchQuery("");
                              }}
                              style={{
                                padding: "10px 12px",
                                cursor: "pointer",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.05)",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(255,255,255,0.08)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <strong
                                style={{ fontSize: "12px", color: "white" }}
                              >
                                @{post.authorUsername}
                              </strong>
                              <p
                                style={{
                                  margin: "2px 0 0",
                                  fontSize: "11px",
                                  color: "rgba(255,255,255,0.6)",
                                }}
                              >
                                {post.content?.slice(0, 50)}...
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* users side */}
                      {!isGuest && (
                        <div
                          style={{
                            flex: 1,
                            maxHeight: "250px",
                            overflowY: "auto",
                          }}
                        >
                          <p
                            style={{
                              padding: "8px 12px",
                              margin: 0,
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "11px",
                              borderBottom: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {t("dashboard.search.users")}
                          </p>
                          {searchResults.users.length === 0 ? (
                            <p
                              style={{
                                padding: "12px",
                                opacity: 0.4,
                                fontSize: "12px",
                                textAlign: "center",
                              }}
                            >
                              {t("dashboard.search.noUsersFound")}
                            </p>
                          ) : (
                            searchResults.users.slice(0, 2).map((u) => (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setShowSearchDropdown(false);
                                  setSearchQuery("");
                                  navigate(`/users/${u.id}`);
                                }}
                                style={{
                                  padding: "10px 12px",
                                  cursor: "pointer",
                                  borderBottom:
                                    "1px solid rgba(255,255,255,0.05)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.08)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                <img
                                  src={u.profilePicUrl || Cat}
                                  alt="pfp"
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                                <div>
                                  <strong
                                    style={{ fontSize: "12px", color: "white" }}
                                  >
                                    @{u.username}
                                  </strong>
                                  <small
                                    style={{
                                      display: "block",
                                      color: "rgba(255,255,255,0.5)",
                                      fontSize: "11px",
                                    }}
                                  >
                                    {u.role}
                                  </small>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      onClick={() => {
                        setShowSearchDropdown(false);
                        navigate(`/search?q=${searchQuery}`);
                      }}
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        color: "#8ca4c6",
                        fontSize: "12px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {t("dashboard.search.seeAll", { query: searchQuery })} →
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
                  whiteSpace: "nowrap",
                }}
                onClick={() =>
                  isGuest
                    ? alert(t("dashboard.post.guestVoteAlert"))
                    : setIsModalOpen(true)
                }
              >
                {t("dashboard.feed.writePost")}
              </button>
            </section>

            {/* feed */}
            <section className="fyp-container">
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
              >
                {[
                  { key: "random", label: t("dashboard.feed.sortAll") },
                  { key: "recent", label: t("dashboard.feed.sortRecent") },
                  { key: "popular", label: t("dashboard.feed.sortPopular") },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      background:
                        sortBy === key ? "#6476af" : "rgba(255,255,255,0.1)",
                      color: "black",
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => fetchRoomsAndPosts()}
                  style={{
                    width: "140px",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    background: "rgba(255,255,255,0.1)",
                    marginLeft: "auto",
                  }}
                >
                  {t("dashboard.sidebar.refreshFeed")}
                </button>
              </div>

              <div className="fyp-feed" id="fyp-feed">
                {loading ? (
                  <p>{t("dashboard.feed.loading")}...</p>
                ) : posts.length === 0 ? (
                  <p>{t("dashboard.feed.empty")}✨</p>
                ) : (
                  sortedPosts.map((post) => {
                    if (post.isHidden) return null;
                    return (
                      <div
                        key={post.id}
                        className="mock-post"
                        style={{
                          border: "1px solid #ccc",
                          marginBottom: "5px",
                          padding: "14px",
                          borderRadius: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "6px",
                          }}
                        >
                          <img
                            src={post.authorProfilePic || Cat}
                            alt="pfp"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid var(--dark)",
                              padding: "2px",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              !isGuest && navigate(`/users/${post.userId}`)
                            }
                          />
                          <strong
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              !isGuest && navigate(`/users/${post.userId}`)
                            }
                          >
                            @{post.authorUsername}
                          </strong>
                          <small
                            style={{
                              background: "#6476af",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                            }}
                          >
                            {post.authorRole || "user"}
                          </small>
                          <small style={{ opacity: 0.6 }}>
                            {getRoomName(post.roomId)}
                          </small>
                        </div>

                        <div
                          className="post-body"
                          style={{ marginTop: "10px", marginBottom: "10px" }}
                        >
                          {post.title && (
                            <h3
                              style={{
                                margin: "0 0 8px 0",
                                fontSize: "1.2rem",
                                color: "var(--text-postTitle)",
                              }}
                            >
                              {post.title}
                            </h3>
                          )}
                          {post.isQuestion && (
  <span style={{
    display: "inline-block",
    fontSize: "11px",
    padding: "2px 10px",
    borderRadius: "10px",
    fontWeight: "bold",
    marginBottom: "8px",
    background: post.isAnswered ? "rgba(39,174,96,0.2)" : "rgba(240,192,64,0.25)",
    color: post.isAnswered ? "#27ae60" : "#f0c040",
    border: `1px solid ${post.isAnswered ? "#27ae60b3" : "#f0c040b3"}`,
  }}>
    {post.isAnswered ? `✓ ${t('dashboard.post.answered')}` : `❓ ${t('dashboard.post.unanswered')}`}
  </span>
)}
                          <p
                            style={{
                              margin: "0 0 8px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {!expanded && post.content.length > LIMIT
                              ? post.content.slice(0, LIMIT) + "..."
                              : post.content}
                            {post.content.length > LIMIT && (
                              <span
                                onClick={() => setExpanded(!expanded)}
                                style={{
                                  color: "#8ca4c6",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  marginLeft: "4px",
                                }}
                              >
                                {expanded ? " see less" : " see more"}
                              </span>
                            )}
                          </p>
                        </div>

                        {post.imageUrl && !isGuest &&  (
                          <div style={{ marginBottom: "8px" }}>
                            <a
                              href={post.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={post.imageUrl}
                                alt="attachment"
                                style={{
                                  maxWidth: "100%",
                                  width: "40%",
                                  borderRadius: "8px",
                                  display: "block",
                                  cursor: "pointer",
                                }}
                              />
                            </a>
                            <a
                              href={post.imageUrl}
                              download
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                                fontSize: "13px",
                                color: "#d4dfed",
                                backgroundColor: "#2b2b2b7d",
                                textDecoration: "none",
                                border: "1px solid #ffffff7d",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {t("dashboard.post.downloadImage")}
                            </a>
                          </div>
                        )}

                        {post.pdfUrl && !isGuest && (
                          <a
                            href={post.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              background: "rgba(16,15,15,0.25)",
                              borderRadius: "6px",
                              color: "white",
                              textDecoration: "none",
                              fontSize: "13px",
                              marginBottom: "8px",
                            }}
                          >
                            {t("dashboard.post.viewPdf")}
                          </a>
                        )}
                        {post.videoUrl && !isGuest && (
                          <video
                            controls
                            style={{
                              maxWidth: "40%",
                              borderRadius: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            <source src={post.videoUrl} />
                            Your browser does not support video.
                          </video>
                        )}

                        {post.resourceLink && !isGuest && (
                          <a
                            href={post.resourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              background: "rgba(100,118,175,0.3)",
                              borderRadius: "6px",
                              color: "white",
                              textDecoration: "none",
                              fontSize: "13px",
                              marginBottom: "8px",
                              height: "30px",
                            }}
                          >
                            🔗{" "}
                            {post.resourceLabel ||
                              t("dashboard.post.openResource")}
                          </a>
                        )}
                        <br />

                        <small>
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : "—"}
                        </small>

                        <div style={{ marginTop: "8px" }}>
                          <button
                            onClick={() =>
                              isGuest
                                ? alert(t("dashboard.post.guestVoteAlert"))
                                : handleVote(post.id, "useful")
                            }
                            style={{
                              fontSize: "13px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#000000",
                              backgroundColor: "#27ae5f9a",
                              border: "1px solid #27ae60b3",
                              height: "30px",
                            }}
                          >
                            {post.voteUseful}
                            {t("dashboard.post.useful")}
                          </button>

                          <button
                            onClick={() =>
                              isGuest
                                ? alert(t("dashboard.post.guestVoteAlert"))
                                : handleVote(post.id, "useless")
                            }
                            style={{
                              marginLeft: "8px",
                              fontSize: "13px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#000000",
                              backgroundColor: "#d9770693",
                              border: "1px solid #c0392bb3",
                              height: "30px",
                            }}
                          >
                            {post.voteUseless}
                            {t("dashboard.post.useless")}
                          </button>

                          <button
                            onClick={() => setSelectedPost(post)}
                            style={{
                              marginLeft: "8px",
                              fontSize: "13px",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#000000",
                              backgroundColor: "#297fb990",
                              border: "1px solid #6cb1df",
                              height: "30px",
                            }}
                          >
                            {t("dashboard.post.comments")} {post.commentCount}
                          </button>

                          {!isGuest && (
                            <button
                              onClick={() => handleSavePost(post.id)}
                              style={{
                                marginLeft: "8px",
                                cursor: "pointer",
                                color: savedPostIds.includes(post.id)
                                  ? "black"
                                  : "inherit",
                                background: "none",
                                borderRadius: "8px",
                                fontSize: "13px",
                                height: "30px",
                                padding: "4px",
                                border: savedPostIds.includes(post.id)
                                  ? "2px solid #31d073"
                                  : "2px solid rgba(10,10,10,0.5)",
                              }}
                            >
                              {savedPostIds.includes(post.id)
                                ? t("dashboard.post.saved")
                                : t("dashboard.post.save")}
                            </button>
                          )}

                          {!isGuest && currentUser?.id !== post.userId && (
                            <button
                              onClick={() =>
                                setReportTarget({
                                  type: "post",
                                  postId: post.id,
                                })
                              }
                              style={{
                                marginLeft: "8px",
                                cursor: "pointer",
                                color: "#ffffff",
                                backgroundColor: "#868686cb",
                                borderColor: "#c0392b",
                                fontSize: "13px",
                                height: "30px",
                                padding: "4px",
                                borderRadius: "8px",
                              }}
                            >
                              {t("dashboard.post.report")}
                            </button>
                          )}

                          {currentUser?.id === post.userId && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              style={{
                                marginLeft: "8px",
                                cursor: "pointer",
                                color: "#f6f4f4",
                                backgroundColor: "#868686db",
                                border: "2px solid #ff0101",
                                fontSize: "13px",
                                height: "30px",
                                padding: "4px",
                                borderRadius: "8px",
                              }}
                            >
                              {t("dashboard.post.delete")}
                            </button>
                          )}

                          {currentUser?.id === post.userId && (
                            <button
                              onClick={() => {
  setEditingPost(post);
  setEditPostTitle(post.title);
  setEditPostContent(post.content);
  setEditPostResourceLink(post.resourceLink || "");
  setEditPostResourceLabel(post.resourceLabel || "");
  setEditPostAttachment(null);
  setRemoveAttachment(false);
}}
                              style={{
                                marginLeft: "8px",
                                color: "#fff",
                                cursor: "pointer",
                                backgroundColor: "#868686d6",
                                border: "2px solid green",
                                fontSize: "13px",
                                height: "30px",
                                padding: "4px",
                                borderRadius: "8px",
                                width: "60px",
                                textAlign: "center",
                              }}
                            >
                              {t("dashboard.post.edit")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                  
                )}
                {!loading && hasMorePosts && (
  <div ref={feedEndRef} style={{ padding: "20px", textAlign: "center", opacity: 0.5, fontSize: "13px" }}>
    {loadingMore ? "Loading more..." : ""}
  </div>
)}
{!hasMorePosts && posts.length > 0 && (
  <p style={{ textAlign: "center", opacity: 0.4, fontSize: "12px", padding: "16px" }}>
    You've reached the end
  </p>
)}
              </div>
            </section>
          </main>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && <Profile embedded />}

        {/* ROOMS TAB */}
        {activeTab === "rooms" && (
          <main className="dashMain">
            <RoomsView
              userRooms={userRooms}
              setUserRooms={setUserRooms}
              subjectRoomsData={subjectRoomsData}
              subjectRoomsLoading={subjectRoomsLoading}
              fetchSubjectRooms={fetchSubjectRooms}
              handleJoinSubjectRoom={handleJoinSubjectRoom}
              handleCreateAndJoinSubjectRoom={handleCreateAndJoinSubjectRoom}
              handleLeaveSubjectRoom={handleLeaveSubjectRoom}
              handleRequestSubjectRoom={handleRequestSubjectRoom}
              requestMajor={requestMajor}
              setRequestMajor={setRequestMajor}
              requestSubject={requestSubject}
              setRequestSubject={setRequestSubject}
              requestFeedback={requestFeedback}
              requestLoading={requestLoading}
              t={t}
              user={user}
            />
          </main>
        )}

        {/* CHAT TAB — placeholder */}
        {/* {activeTab === "chat" &&(
        <div style={{ padding: "20px" }}>
          <p style={{ opacity: 0.5 }}>{t('dashboard.nav.chat')} — coming soon</p>
        </div>
      )} */}
        {activeTab === "chat" && !isGuest && <ChatTab />}

        {/* ADMIN TAB */}
        {activeTab === "admin" && isAdmin && <AdminPanel embedded />}

        {/* SUPERADMIN TAB */}
        {activeTab === "superadmin" && isSuperAdmin && (
          <SuperadminPanel embedded />
        )}

        {/* GUIDE TAB */}
        {activeTab === "guide" && <GuidePage embedded />}
      </div>

      {/* ── ALL MODALS STAY HERE (unchanged) ── */}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0 }}>{t("dashboard.postModal.title")}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder={t("dashboard.postModal.titlePlaceholder")}
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            <Select
              options={groupedRoomOptions}
              value={selectedPostRoom}
              onChange={(selected) => setSelectedPostRoom(selected)}
              placeholder={t("dashboard.postModal.selectRoom")}
              styles={customSelect}
            />
            <br />
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={t("dashboard.postModal.contentPlaceholder")}
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "13px", opacity: 0.8, cursor: "pointer" }}>
  <input
    type="checkbox"
    checked={postIsQuestion}
    onChange={(e) => setPostIsQuestion(e.target.checked)}
  />
  {t("dashboard.postModal.isQuestionLabel")}
</label>
            <div style={{ marginTop: "10px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  opacity: 0.7,
                  fontSize: "13px",
                }}
              >
                {t("dashboard.postModal.attachLabel")}
              </label>
              <input
                type="file"
                accept="image/*,.pdf,video/*"
                onChange={(e) => setPostAttachment(e.target.files[0])}
                style={{ fontSize: "13px", color: "white" }}
              />
              {postAttachment && (
                <small
                  style={{ display: "block", marginTop: "4px", opacity: 0.6 }}
                >
                  {postAttachment.name}
                  <button
                    onClick={() => setPostAttachment(null)}
                    style={{
                      marginLeft: "8px",
                      background: "none",
                      border: "none",
                      color: "#fc0c0c",
                      cursor: "pointer",
                      fontSize: "11px",
                    }}
                  >
                    ✕ Remove
                  </button>
                </small>
              )}
            </div>
            <div style={{ marginTop: "10px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  opacity: 0.7,
                  fontSize: "13px",
                }}
              >
                {t("dashboard.postModal.resourceLinkLabel")} (Google Drive,
                GitHub, etc.)
              </label>
              <input
                type="url"
                placeholder={t("dashboard.postModal.resourceLinkPlaceholder")}
                value={postResourceLink}
                onChange={(e) => setPostResourceLink(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                  marginBottom: "6px",
                }}
              />
              <input
                type="text"
                placeholder={t("dashboard.postModal.resourceLabelPlaceholder")}
                value={postResourceLabel}
                onChange={(e) => setPostResourceLabel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <br />
            <br />
            <div
              className="modal-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button onClick={() => setIsModalOpen(false)}>
                {t("dashboard.postModal.cancel")}
              </button>
              <button
                onClick={handleSubmitPost}
                disabled={
                  !postContent.trim() || !selectedPostRoom || isSubmitting
                }
              >
                {isSubmitting
                  ? t("dashboard.postModal.posting")
                  : t("dashboard.postModal.post")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPost && (
        <div className="modal-overlay" onClick={() => setEditingPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {t("dashboard.postModal.editTitle")}
              </h3>
              <button
                onClick={() => setEditingPost(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              value={editPostTitle}
              onChange={(e) => setEditPostTitle(e.target.value)}
              placeholder="Title"
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
            <textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              placeholder="Content"
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              
            />
            <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", fontSize: "13px", opacity: 0.8, cursor: "pointer" }}>
  <input
    type="checkbox"
    checked={editingPost.isQuestion || false}
    onChange={(e) => setEditingPost({ ...editingPost, isQuestion: e.target.checked })}
  />
  {t("dashboard.postModal.isQuestionLabel")}
</label>
            {/* current attachment */}
{(editingPost.imageUrl || editingPost.pdfUrl || editingPost.videoUrl) && !removeAttachment && (
  <div style={{ marginTop:"10px", padding:"8px", background:"rgba(255,255,255,0.05)", borderRadius:"6px", fontSize:"12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
    <span style={{ opacity:0.7 }}>
      {editingPost.imageUrl && "🖼️ Current image"}
      {editingPost.pdfUrl && "📄 Current PDF"}
      {editingPost.videoUrl && "🎥 Current video"}
    </span>
    <button
      onClick={() => setRemoveAttachment(true)}
      style={{ background:"none", border:"none", color:"#fc0c0c", cursor:"pointer", fontSize:"11px" }}
    >
      ✕ Remove
    </button>
  </div>
)}
{removeAttachment && (
  <div style={{ marginTop:"6px", fontSize:"12px", color:"#fc0c0c", display:"flex", alignItems:"center", gap:"8px" }}>
    Attachment will be removed
    <button onClick={() => setRemoveAttachment(false)} style={{ background:"none", border:"none", color:"#8ca4c6", cursor:"pointer", fontSize:"11px" }}>↩ undo</button>
  </div>
)}

{/* new attachment */}
<div style={{ marginTop:"10px" }}>
  <label style={{ display:"block", marginBottom:"6px", opacity:0.7, fontSize:"13px" }}>
    Replace attachment
  </label>
  <input
    type="file"
    accept="image/*,.pdf,video/*"
    onChange={(e) => { setEditPostAttachment(e.target.files[0]); setRemoveAttachment(false); }}
    style={{ fontSize:"13px", color:"white" }}
  />
  {editPostAttachment && (
    <small style={{ display:"block", marginTop:"4px", opacity:0.6 }}>
      {editPostAttachment.name}
      <button onClick={() => setEditPostAttachment(null)} style={{ marginLeft:"8px", background:"none", border:"none", color:"#fc0c0c", cursor:"pointer", fontSize:"11px" }}>✕</button>
    </small>
  )}
</div>

{/* resource link */}
<div style={{ marginTop:"10px" }}>
  <label style={{ display:"block", marginBottom:"6px", opacity:0.7, fontSize:"13px" }}>Resource link</label>
  <input
    type="url"
    placeholder="https://..."
    value={editPostResourceLink}
    onChange={(e) => setEditPostResourceLink(e.target.value)}
    style={{ width:"100%", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box", marginBottom:"6px" }}
  />
  <input
    type="text"
    placeholder="Link label (optional)"
    value={editPostResourceLabel}
    onChange={(e) => setEditPostResourceLabel(e.target.value)}
    style={{ width:"100%", padding:"8px", borderRadius:"8px", border:"1px solid #ccc", boxSizing:"border-box" }}
  />
</div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() => setEditingPost(null)}
                style={{
                  padding: "4px",
                  width: "60px",
                  textAlign: "center",
                  backgroundColor: "#da2828",
                  color: "white",
                  borderRadius: "8px",
                }}
              >
                {t("dashboard.postModal.cancel")}
              </button>
              <button
                onClick={() => handleEditPost(editingPost.id)}
                disabled={isSubmitting}
                style={{
                  padding: "4px",
                  backgroundColor: "#3ada28",
                  color: "black",
                  borderRadius: "8px",
                  width: "60px",
                  textAlign: "center",
                }}
              >
                {isSubmitting
                  ? t("dashboard.postModal.saving")
                  : t("dashboard.postModal.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <PostModal
          postId={selectedPost.id}
          onClose={() => setSelectedPost(null)}
          isGuest={isGuest}
          onPostUpdate={handlePostUpdated}
        />
      )}

      {showBrowseRooms && (
        <div
          className="modal-overlay"
          onClick={() => setShowBrowseRooms(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "100vh", overflowY: "auto" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0 }}>{t("dashboard.browseRooms.title")}</h3>
              <button
                onClick={() => setShowBrowseRooms(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            {subjectRoomsLoading ? (
              <p style={{ opacity: 0.5, textAlign: "center" }}>Loading...</p>
            ) : subjectRoomsData.length === 0 ? (
              <p style={{ opacity: 0.5, textAlign: "center" }}>
                {t("dashboard.browseRooms.noRooms")}
              </p>
            ) : (
              subjectRoomsData.map(({ major, majorId, rooms, available }) => (
                <div key={major} style={{ marginBottom: "20px" }}>
                  <h4
                    style={{
                      margin: "0 0 10px",
                      color: "#6476af",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      paddingBottom: "6px",
                    }}
                  >
                    {major}
                  </h4>
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        marginBottom: "6px",
                        background: "rgba(100,118,175,0.2)",
                        borderRadius: "8px",
                      }}
                    >
                      <span>✓ {room.name}</span>
                      <button
                        onClick={() => handleLeaveSubjectRoom(room.id)}
                        style={{
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          background: "transparent",
                          border: "1px solid #fc0c0c",
                          color: "#fc0c0c",
                          cursor: "pointer",
                        }}
                      >
                        {t("dashboard.browseRooms.leave")}
                      </button>
                    </div>
                  ))}
                  {available.map((subject) => (
                    <div
                      key={subject}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        marginBottom: "6px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                      }}
                    >
                      <span style={{ opacity: 0.7 }}>{subject}</span>
                      <button
                        onClick={() =>
                          handleCreateAndJoinSubjectRoom(
                            major,
                            majorId,
                            subject,
                          )
                        }
                        style={{
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          background: "#6476af",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {t("dashboard.browseRooms.join")}
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div
              style={{
                marginTop: "24px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: "16px",
              }}
            >
              <h4
                style={{ margin: "0 0 12px", opacity: 0.7, fontSize: "13px" }}
              >
                {t("dashboard.browseRooms.requestTitle")}
              </h4>
              <select
                value={requestMajor}
                onChange={(e) => {
                  setRequestMajor(e.target.value);
                  setRequestFeedback("");
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "#252b45",
                  color: "white",
                  marginBottom: "8px",
                }}
              >
                <option value="">
                  {t("dashboard.browseRooms.selectMajor")}
                </option>
                {subjectRoomsData.map(({ major, majorId }) => (
                  <option key={major} value={majorId}>
                    {major}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t("dashboard.browseRooms.subjectPlaceholder")}
                value={requestSubject}
                onChange={(e) => {
                  setRequestSubject(e.target.value);
                  setRequestFeedback("");
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  boxSizing: "border-box",
                  marginBottom: "8px",
                }}
              />
              {requestFeedback && (
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "13px",
                    color:
                      requestFeedback.includes("notified") ||
                      requestFeedback.includes("submitted")
                        ? "#27ae60"
                        : "#e74c3c",
                  }}
                >
                  {requestFeedback}
                </p>
              )}
              <button
                onClick={handleRequestSubjectRoom}
                disabled={
                  !requestMajor || !requestSubject.trim() || requestLoading
                }
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "#6476af",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  opacity: !requestMajor || !requestSubject.trim() ? 0.5 : 1,
                }}
              >
                {requestLoading
                  ? t("dashboard.browseRooms.sending")
                  : t("dashboard.browseRooms.sendRequest")}
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
        <div
          className="modal-overlay"
          onClick={() => setShowAnnouncements(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0 }}>
                {t("dashboard.announcements.title")}
              </h3>
              <button
                onClick={() => setShowAnnouncements(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {announcements.length === 0 ? (
                <p style={{ opacity: 0.5, textAlign: "center" }}>
                  {t("dashboard.announcements.empty")}
                </p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: "#252b45",
                      borderRadius: "10px",
                      padding: "14px",
                      marginBottom: "10px",
                    }}
                  >
                    <p style={{ margin: "0 0 8px" }}>{a.message}</p>
                    <small style={{ opacity: 0.5 }}>
                      By @{a.created_by_username} —{" "}
                      {new Date(a.created_at).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
