import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'

import { ToastProvider } from './context/ToastContext'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'

import AuthChoice from './pages/AuthChoice'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import Feed from './pages/Feed'
import Post from './pages/Post'
import Profile from './pages/Profile'
import PostDetail from './pages/PostDetail'
import SearchPage from './pages/SearchPage'
import Explore from './pages/Explore'
import MapView from './pages/MapView'
import UserProfileView from './pages/UserProfileView'
import Notifications from './pages/Notifications'
import ChangeEmail from './components/ChangeEmail'
import ChangePassword from './components/ChangePassword'
import EditProfile from './components/EditProfile'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import NotFound from './pages/NotFound'
import NotifPopup from './components/NotifPopup'

// ── Auth guard ──
function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/" replace />
  return children
}

// ── Guest guard (redirect if already logged in) ──
function GuestOnly({ children }) {
  const token = localStorage.getItem('token')
  if (token) return <Navigate to="/feed" replace />
  return children
}

const AUTH_ROUTES = ['/', '/signin', '/signup', '/forgot-password']

function AppRoutes() {
  const location = useLocation()
  const isAuthPage = AUTH_ROUTES.includes(location.pathname)

  // Drive sidebar-aware body padding from a data attribute so CSS
  // can apply padding-left only when the sidebar is actually visible.
  React.useEffect(() => {
    document.body.setAttribute('data-sidebar', isAuthPage ? 'off' : 'on')
    return () => document.body.removeAttribute('data-sidebar')
  }, [isAuthPage])

  return (
    <>
      <Routes>
        {/* Public / guest-only */}
        <Route
          path="/"
          element={
            <GuestOnly>
              <AuthChoice />
            </GuestOnly>
          }
        />
        <Route
          path="/signin"
          element={
            <GuestOnly>
              <SignIn />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <SignUp />
            </GuestOnly>
          }
        />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />

        {/* Protected */}
        <Route
          path="/feed"
          element={
            <RequireAuth>
              <Feed />
            </RequireAuth>
          }
        />
        <Route
          path="/post"
          element={
            <RequireAuth>
              <Post />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <RequireAuth>
              <EditProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/change-email"
          element={
            <RequireAuth>
              <ChangeEmail />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/change-password"
          element={
            <RequireAuth>
              <ChangePassword />
            </RequireAuth>
          }
        />

        <Route
          path="/search"
          element={<RequireAuth><SearchPage /></RequireAuth>}
        />
        <Route
          path="/explore"
          element={<RequireAuth><Explore /></RequireAuth>}
        />
        <Route
          path="/map"
          element={<RequireAuth><MapView /></RequireAuth>}
        />
        <Route
          path="/user/:userId"
          element={<RequireAuth><UserProfileView /></RequireAuth>}
        />
        <Route
          path="/posts/:postId"
          element={<RequireAuth><PostDetail /></RequireAuth>}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAuthPage && (
        <>
          <SideNav />
          <BottomNav />
          <NotifPopup />
        </>
      )}
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SocketProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SocketProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
