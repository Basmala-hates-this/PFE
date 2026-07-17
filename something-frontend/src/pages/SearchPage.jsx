import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import PostModal from "../assets/components/PostModal.jsx";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";
import "../styles/search.css"; // Import the CSS file
import api from "../api/axios.js";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const [selectedPost, setSelectedPost] = useState(null);

  const guestToken = localStorage.getItem("guestToken");
  const isGuest = !!guestToken;
  const guestUniversities =
    JSON.parse(localStorage.getItem("guestUniversities")) || [];

  const { t } = useTranslation();

  //////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!query) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
       

        const requests = [
          api.get(`/posts/search?q=${query}`,),
        ];
        if (!isGuest) {
          requests.push(api.get(`/users/search?q=${query}`));
        }

        const results = await Promise.all(requests);
        let filteredPosts = results[0].data;

        if (isGuest) {
          // const roomsRes = await axios.get("http://localhost:5000/api/rooms/public-rooms");
          const roomsRes = await api.get("/rooms/public-rooms");

          const selectedCodes = guestUniversities.map((u) => u.value);
          const allowedRooms = roomsRes.data.filter(
            (r) => r.type === "public" || selectedCodes.includes(r.university),
          );
          // console.log("guest allowed rooms sample:", allowedRooms[0]);
          // console.log("post sample:", filteredPosts[0]);
          const allowedRoomIds = allowedRooms.map((r) => r.id);
          filteredPosts = filteredPosts.filter((p) =>
            allowedRoomIds.includes(p.roomId),
          );
        } else {
          // filter by user's own rooms

          const roomsRes = await api.get("/rooms/my-rooms");

          // console.log("rooms sample:", roomsRes.data[0]);
          // console.log("posts sample:", results[0].data[0]);

          const allowedRoomIds = roomsRes.data
            .filter((r) => r.type !== "private")
            .map((r) => r.id);

          filteredPosts = filteredPosts.filter((p) =>
            allowedRoomIds.includes(p.roomId),
          );
        }

        setPosts(filteredPosts);
        const currentUser = JSON.parse(
          localStorage.getItem("currentUser") || "{}",
        );
        setUsers(
          isGuest ? [] : results[1].data.filter((u) => u.id !== currentUser.id),
        );
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  const [expanded, setExpanded] = useState(false);
  const LIMIT = 120;

  //////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  return (
    <div className="searchpage-container">
      {/* header */}
      <div className="searchpage-header">
        <button
          onClick={() => navigate("/dashboard")}
          className="searchpage-back-button"
        >
          ←
        </button>
        <h2 className="searchpage-title">{`${t("searchPage.resultsFor")} "${query}"`}</h2>
      </div>

      {/* tabs */}
      <div className="searchpage-tabs">
        <button
          onClick={() => setActiveTab("posts")}
          className={`searchpage-tab ${activeTab === "posts" ? "searchpage-tab-active" : "searchpage-tab-inactive"}`}
        >
          {`${t("searchPage.postsTab")} (${posts.length})`}
        </button>
        {!isGuest && (
          <button
            onClick={() => setActiveTab("users")}
            className={`searchpage-tab ${activeTab === "users" ? "searchpage-tab-active" : "searchpage-tab-inactive"}`}
          >
            {`${t("searchPage.usersTab")} (${users.length})`}
          </button>
        )}
      </div>

      {loading ? (
        <p className="searchpage-loading">{t("searchPage.searching")}</p>
      ) : (
        <>
          {/* posts tab */}
          {activeTab === "posts" && (
            <div>
              {posts.length === 0 ? (
                <p className="searchpage-empty">{`${t("searchPage.noPostsFound")} "${query}"`}</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="searchpage-post-card"
                  >
                    <div className="searchpage-post-header">
                      <img
                        src={post.authorProfilePicUrl || Cat}
                        alt="pfp"
                        className="searchpage-user-avatar"
                      />

                      <strong className="searchpage-post-author">
                        @{post.authorUsername}
                      </strong>
                      <small className="searchpage-post-role-badge">
                        {post.authorRole || "user"}
                      </small>
                    </div>
                    {post.title && (
                      <h3 className="searchpage-post-title">{post.title}</h3>
                    )}
                    <p className="searchpage-post-content">
                      {" "}
                      {!expanded && post.content.length > LIMIT
                        ? post.content.slice(0, LIMIT) + "..."
                        : post.content}
                    </p>
                    <small className="searchpage-post-date">
                      {new Date(post.createdAt).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>
          )}

          {/* users tab */}
          {activeTab === "users" && (
            <div>
              {users.length === 0 ? (
                <p className="searchpage-empty">{`${t("searchPage.noUsersFound")} "${query}"`}</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="searchpage-user-card"
                  >
                    <img
                      src={user.profile_pic_url || Cat}
                      alt="pfp"
                      className="searchpage-user-avatar"
                    />
                    <div className="searchpage-user-info">
                      <strong className="searchpage-username">
                        @{user.username}
                      </strong>
                      <small className="searchpage-user-details">
                        {user.role} •{" "}
                        {`${t("searchPage.rating")}: ${user.rating ?? 1} / 5`}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {selectedPost && (
        <PostModal
          postId={selectedPost.id}
          onClose={() => setSelectedPost(null)}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}
