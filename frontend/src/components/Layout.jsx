// src/components/Layout.jsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './Navbar'

export default function Layout() {
  return (
    <>
      <Outlet /> {/* renders matched child route component */}
      <BottomNav /> {/* navbar always visible */}
    </>
  )
}
