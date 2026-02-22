// src/context/PostsContext.jsx
import React, { createContext, useState } from 'react'

export const PostsContext = createContext()

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([])

  const addPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
  }

  return (
    <PostsContext.Provider value={{ posts, addPost }}>
      {children}
    </PostsContext.Provider>
  )
}
