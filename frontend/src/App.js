import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import AuthChoice from "./pages/AuthChoice";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Feed from "./pages/Feed";
import Post from "./pages/Post";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import ChangeEmail from "./components/ChangeEmail";
import ChangePassword from "./components/ChangePassword";
import EditProfile from "./components/EditProfile";
import BottomNav from "./components/BottomNav";

// Nested component to access location and conditionally show BottomNav
function AppRoutes() {
  const location = useLocation();
  const hideNav = ["/", "/signin", "/signup", "/profile/change-email", "/profile/change-password", "/edit-profile"].includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<AuthChoice />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/post" element={<Post />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile/change-email" element={<ChangeEmail />} />
        <Route path="/profile/change-password" element={<ChangePassword />} />

        {/* ✅ Fixed route to match /edit-profile */}
        <Route path="/edit-profile" element={<EditProfile />} />
      </Routes>

      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
