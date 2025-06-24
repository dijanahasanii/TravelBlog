# Travel Blog Platform - Final Project

This is a microservices-based travel blog platform built as the final project for **Advanced Programming** course.

---

## Table of Contents

- [Project Overview](#project-overview)  
- [Architecture](#architecture)  
- [Technology Stack](#technology-stack)  
- [Setup & Running Locally](#setup--running-locally)  
- [Services & API Endpoints](#services--api-endpoints)  
- [Environment Variables](#environment-variables)  
- [Security](#security)  
- [Testing](#testing)  
- [Known Issues](#known-issues)  
- [Future Improvements](#future-improvements)  
- [Team](#team)

---

## Project Overview

This platform allows users to create accounts, post travel experiences with photos and captions, select locations, and receive notifications. It is built using a microservices architecture with containerized services deployed via Docker Compose.

---

## Architecture

![Architecture Diagram](./docs/architecture-diagram.png)

- **User Service:** Handles user authentication, registration, and profiles  
- **Content Service:** Manages posts with images, captions, and location data  
- **Location Service:** Provides location data and related queries  
- **Notification Service:** Manages user notifications  
- **Frontend:** React SPA interacting with backend services via REST APIs

---

## Technology Stack

| Layer            | Technology            |
|------------------|------------------------|
| Frontend         | React.js              |
| Backend          | Node.js, Express      |
| Database         | MongoDB               |
| Containerization | Docker, Docker Compose|
| Authentication   | JWT (JSON Web Tokens) |

---

## Setup & Running Locally

### Prerequisites

- Docker & Docker Compose installed  
- Git installed

### Clone repository

```bash
git clone https://github.com/your-username/travel-blog-platform.git
cd travel-blog-platform
```

### Environment Variables

Create `.env` files in each service folder or in the root directory. See [Environment Variables](#environment-variables).

### Build and run all services

```bash
docker-compose up --build
```

### Access the frontend

Open your browser and visit:  
http://localhost:3000

---

## Services & API Endpoints

### User Service (http://localhost:5004)

| Endpoint             | Method | Description                |
|----------------------|--------|----------------------------|
| `/api/auth/signup`   | POST   | Register new user          |
| `/api/auth/login`    | POST   | User login and JWT issuance|
| `/api/users/:id`     | GET    | Get user profile by ID     |

### Content Service (http://localhost:5002)

| Endpoint         | Method | Description         |
|------------------|--------|---------------------|
| `/posts`         | GET    | Get posts feed      |
| `/posts`         | POST   | Create new post     |
| `/posts/:id`     | GET    | Get specific post   |

### Location Service (http://localhost:5003)

| Endpoint         | Method | Description         |
|------------------|--------|---------------------|
| `/locations`     | GET    | List all locations  |

### Notification Service (http://localhost:5006)

| Endpoint                | Method | Description                   |
|-------------------------|--------|-------------------------------|
| `/notifications`        | GET    | Fetch user notifications      |
| `/notifications/mark`   | POST   | Mark notifications as read    |

---

## Environment Variables

Each service uses environment variables for configuration.

### Example `.env`

```env
MONGO_URI=mongodb://mongo:27017/db-name
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Security

- JWT authentication for protected routes  
- Basic input validation and sanitization  
- Environment variables used for secrets (no hardcoding)  

---

## Testing

- Manual testing through frontend and API tools like Postman  
- Unit and integration tests (add if implemented)

---

## Known Issues

- Notifications use polling instead of WebSockets  
- Image uploads not compressed  
- No email/phone verification  
- No pagination in post feed

---

## Future Improvements

- Implement role-based authorization  
- Add automated tests  
- CI/CD integration  
- Add caching layer and message queues

---
## Code Commenting Summary
Some parts of the codebase include comments to explain key functions and complex logic. Comments are placed inside source files near the relevant code, mainly using inline and JSDoc-style formats. While not every file is fully commented, the included comments aim to improve readability and help understand important parts of the project.
---


## Team

- **Gentiana:** Backend - User Service  
  (User registration, login, JWT auth, user profiles, password security)

- **Dijana:** Backend - Content Service & Notification Service  
  (Posts CRUD, image handling, likes/comments, notifications management, API docs)

- **Selvie:** Backend - Location Service  
  (Location data management, location lookup APIs, geocoding, integration)

---

This project was developed for the **Advanced Programming** course by **Prof. Agon Bajgora**.