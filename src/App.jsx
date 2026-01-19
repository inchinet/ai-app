import { useState, useMemo, useEffect } from 'react'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './App.css'
import mockData from './mockData.json'
import PostEditor from './components/PostEditor'
import ErrorBoundary from './components/ErrorBoundary'

const ADMIN_EMAIL = 'inchinet@gmail.com'
// In a real app, Client ID should be in .env. 
// For now, I'll need the user to provide their Client ID or I use a placeholder.
// I will use a placeholder and warn the user.
const GOOGLE_CLIENT_ID = "88841847221-5b04ddeiug2ur972181g3914k77edeea.apps.googleusercontent.com"

const isDev = import.meta.env.DEV;
// In production, we use relative paths ('api' and '') so it works in any subdirectory
const API_URL = isDev ? 'http://localhost:3001/api' : 'api';

function App() {
  const [activeTab, setActiveTab] = useState('work') // 'work' or 'program'

  // Banner URL state - default if not loaded yet
  const [bannerUrl, setBannerUrl] = useState('https://picsum.photos/seed/portfolio/1600/900')

  // Posts state
  const [posts, setPosts] = useState([])

  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userToken, setUserToken] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState(null)

  // Load posts and settings from SERVER on mount
  useEffect(() => {
    // Fetch posts
    fetch(`${API_URL}/posts`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setPosts(data)
        } else {
          // Initial load: if server empty, use mockData
          setPosts(mockData)
        }
      })
      .catch(err => {
        console.error("Failed to load posts", err)
        // Fallback
        setPosts(mockData)
      })

    // Fetch settings (banner etc)
    fetch(`${API_URL}/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && data.bannerUrl) {
          // If the saved URL is relative (e.g., 'uploads/...'), prepend localhost in dev
          const displayUrl = (isDev && !data.bannerUrl.startsWith('http'))
            ? `http://localhost:3001/${data.bannerUrl}`
            : data.bannerUrl
          setBannerUrl(displayUrl)
        }
      })
      .catch(err => console.error("Failed to load settings", err))
  }, [])

  // Save posts to SERVER whenever they change
  // Note: Optimizing to only save when necessary would be better, but user asked for "Save" flow.
  // Actually, in `handleSavePost` is better than useEffect for server sync to avoid chatty updates?
  // But usage of localStorage was automatic. Let's keep it manual save in handleSavePost for now?
  // No, `handleSavePost` updates local state. We should sync that state to server.
  // But wait, `delete` and `edit` also update state.
  // Use `useEffect` with debounce or just save on changes.
  useEffect(() => {
    if (posts.length > 0 && isAdmin && userToken) {
      fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(posts)
      }).catch(err => console.error("Failed to save posts", err))
    }
  }, [posts, isAdmin, userToken])

  // (Removed localStorage banner persistence)

  // Banner upload to SERVER
  const handleBannerUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`
        },
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            // If dev, we prepend localhost for the current view
            const fullUrl = isDev ? `http://localhost:3001/${data.url}` : data.url
            setBannerUrl(fullUrl)

            // CRITICAL: Save the relative path (data.url) to server, NOT the full localhost URL
            fetch(`${API_URL}/settings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
              },
              body: JSON.stringify({ bannerUrl: data.url })
            }).catch(err => console.error("Failed to save banner setting", err))
          }
        })
        .catch(err => alert('Banner Upload Failed'))
    }
  }

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => post.type === activeTab)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [activeTab, posts])

  // Google Login Success
  const handleLoginSuccess = (credentialResponse) => {
    // Decode JWT - simplified for client-side check (In prod, verify on server)
    // We need jwt-decode or just naive decode.
    // For safety, let's use a simple base64 decode of the payload.
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const email = payload.email;
      if (email === ADMIN_EMAIL) {
        setIsAdmin(true);
        setUserEmail(email);
        setUserToken(credentialResponse.credential);
      } else {
        alert('Access Denied: You are not the admin.');
      }
    } catch (e) {
      console.error("Login Error", e);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false)
    setUserEmail('')
    setUserToken(null)
    setShowEditor(false)
    setEditingPost(null)
  }

  const handleNewPost = () => {
    setEditingPost(null)
    setShowEditor(true)
  }

  const handleEdit = (post) => {
    setEditingPost(post)
    setShowEditor(true)
  }

  const handleSavePost = (postData) => {
    if (editingPost) {
      // Update existing post
      setPosts(posts.map(p => p.id === postData.id ? postData : p))
    } else {
      // Add new post
      setPosts([...posts, postData])
    }
    setShowEditor(false)
    setEditingPost(null)
  }

  const handleDelete = (postId) => {
    if (confirm('確定要刪除此文章嗎？')) {
      setPosts(posts.filter(p => p.id !== postId))
    }
  }

  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditingPost(null)
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="app-container">
        {/* Admin Controls */}
        <div className="admin-controls">
          {!isAdmin ? (
            <div className="google-login-wrapper">
              {/* 
                 NOTE: You need to replace GOOGLE_CLIENT_ID with your actual ID 
                 from Google Cloud Console to make this work.
               */}
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => {
                  console.log('Login Failed');
                }}
                useOneTap
                type="icon"
                shape="circle"
              />
              {/* DEV LOGIN BYPASS - Only visible in development */}
              {isDev && (
                <button
                  onClick={() => {
                    setIsAdmin(true);
                    setUserEmail(ADMIN_EMAIL);
                  }}
                  style={{ marginLeft: '10px', padding: '5px', background: 'transparent', border: '1px solid #444', color: '#666', fontSize: '10px', cursor: 'pointer' }}
                  title="Dev Login Bypass"
                >
                  🕵️
                </button>
              )}
            </div>
          ) : (
            <div className="admin-info">
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>

        {/* 16:9 Banner */}
        <header className="banner">
          <img src={bannerUrl} alt="Portfolio Banner" className="banner-img" />
          <div className="banner-overlay">
            <h1 className="banner-title">我的AI 作品</h1>
            <p className="banner-subtitle">以下為我部分AI作品</p>

            {/* Admin Banner Edit */}
            {isAdmin && (
              <label className="banner-edit-btn">
                📷 更換 Banner
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </header>

        {/* Tabs */}
        <nav className="tabs">
          <button
            className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            作品，文章
          </button>
          <button
            className={`tab-btn ${activeTab === 'program' ? 'active' : ''}`}
            onClick={() => setActiveTab('program')}
          >
            小程式
          </button>
        </nav>

        {/* New Post Button (Admin Only) */}
        {isAdmin && (
          <div className="new-post-container">
            <button className="new-post-btn" onClick={handleNewPost}>
              ➕ 新增文章
            </button>
          </div>
        )}

        {/* Post List */}
        <main className="posts-grid">
          {filteredPosts.map(post => (
            <article key={post.id} className="glass-card post-card">
              <div className="post-header">
                <h2>{post.title}</h2>
                <span className="post-date">
                  {new Date(post.date).toLocaleDateString()}
                </span>
              </div>

              <ErrorBoundary>
                <div
                  className="post-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </ErrorBoundary>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="post-admin-controls">
                  <button className="admin-btn edit-btn" onClick={() => handleEdit(post)}>
                    ✏️ Edit
                  </button>
                  <button className="admin-btn delete-btn" onClick={() => handleDelete(post.id)}>
                    🗑️ Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </main>

        {/* Post Editor Modal */}
        {showEditor && (
          <PostEditor
            post={editingPost}
            onSave={handleSavePost}
            onCancel={handleCancelEdit}
            baseUrl={isDev ? 'http://localhost:3001/' : ''}
            userToken={userToken}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  )
}

export default App
