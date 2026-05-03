# Citizen Complaint Management System - Backend

A comprehensive backend API for a citizen complaint management system built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication & Authorization**
  - User registration and login
  - JWT-based authentication
  - Role-based access control (Citizen/Admin)

- **Complaint Management**
  - Create, read, update, delete complaints
  - Complaint categorization and prioritization
  - Status tracking (Pending, Under Review, In Progress, Resolved, Closed)
  - Public complaint tracking

- **Comment System**
  - Add comments to complaints
  - Internal comments for admins
  - Threaded discussions

- **Admin Dashboard**
  - View all complaints
  - Assign complaints to admins
  - Update complaint status
  - Manage users

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **CORS**: Enabled for frontend integration

## Project Structure

```
complaint-portal-backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── auth.js              # Authentication logic
│   ├── complaints.js        # Complaint CRUD operations
│   └── comments.js          # Comment management
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User schema
│   ├── Complaint.js         # Complaint schema
│   └── Comment.js           # Comment schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── complaints.js        # Complaint routes
│   └── comments.js          # Comment routes
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
└── server.js                # Main application entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

### Installation

1. **Clone the repository** (if applicable) or navigate to the backend directory:
   ```bash
   cd complaint-portal-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy the existing `.env` file or create a new one
   - Update the MongoDB connection string:
     ```
     MONGO_URI=mongodb+srv://yourUsername:yourPassword@cluster0.mongodb.net/complainportal
     ```
   - Replace `yourUsername` and `yourPassword` with your actual MongoDB credentials
   - The JWT_SECRET is already configured but can be changed for security

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Complaints
- `GET /api/complaints` - Get all complaints (filtered by user role)
- `GET /api/complaints/public` - Get public complaints for tracking
- `GET /api/complaints/:id` - Get single complaint
- `POST /api/complaints` - Create new complaint
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/complaints/user/my-complaints` - Get user's complaints
- `PUT /api/complaints/:id/status` - Update complaint status (Admin only)
- `PUT /api/complaints/:id/assign` - Assign complaint to admin (Admin only)

### Comments
- `GET /api/complaints/:complaintId/comments` - Get comments for a complaint
- `GET /api/complaints/:complaintId/comments/:commentId` - Get single comment
- `POST /api/complaints/:complaintId/comments` - Create new comment
- `PUT /api/complaints/:complaintId/comments/:commentId` - Update comment
- `DELETE /api/complaints/:complaintId/comments/:commentId` - Delete comment

## User Roles

### Citizen
- Register and login
- Create and manage their own complaints
- View complaint status and updates
- Add comments to their complaints

### Admin
- All citizen permissions
- View all complaints in the system
- Update complaint status and resolution
- Assign complaints to other admins
- Add internal comments (visible only to admins)
- Access admin dashboard

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (citizen/admin),
  phone: String,
  address: String,
  createdAt: Date
}
```

### Complaint
```javascript
{
  title: String,
  description: String,
  category: String,
  priority: String,
  status: String,
  location: String,
  user: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User),
  attachments: [String],
  resolution: String,
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Comment
```javascript
{
  content: String,
  complaint: ObjectId (ref: Complaint),
  user: ObjectId (ref: User),
  isInternal: Boolean,
  createdAt: Date
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Role-based access control
- Input validation and sanitization
- CORS enabled for frontend integration

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Testing the API

You can test the API endpoints using tools like:
- Postman
- Insomnia
- curl commands

Example curl command for registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Deployment

1. Set up a MongoDB database (Atlas recommended for production)
2. Update environment variables for production
3. Deploy to a hosting service (Heroku, DigitalOcean, AWS, etc.)
4. Ensure proper security configurations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.