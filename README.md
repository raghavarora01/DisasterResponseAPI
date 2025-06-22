# Disaster Response Platform - Server

This is the backend server for the Disaster Response Coordination Platform, built with Node.js, Express, and Supabase. It provides RESTful APIs and real-time communication capabilities for disaster management and coordination.

## Features

- **Disaster Management**: Create, read, update, and delete disaster events
- **Real-time Updates**: WebSocket support for live updates
- **Geocoding**: Convert addresses to geographic coordinates
- **Resource Management**: Track and manage disaster response resources
- **Social Media Integration**: Aggregate and manage social media posts related to disasters
- **Image Verification**: Handle image uploads and verification
- **Authentication**: Secure API endpoints with JWT authentication

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.IO
- **Environment Management**: dotenv
- **CORS**: cors
- **HTTP Client**: node-fetch

## API Endpoints

### Disaster Management
- `POST /api/disasters` - Create a new disaster event
- `GET /api/disasters` - Get all disaster events
- `PUT /api/disasters/:id` - Update a disaster event
- `DELETE /api/disasters/:id` - Delete a disaster event

### Geocoding
- `GET /api/geocode` - Convert address to coordinates

### Resources
- `GET /api/resources` - Get available resources
- `POST /api/resources` - Add new resources
- `PUT /api/resources/:id` - Update resource information
- `DELETE /api/resources/:id` - Remove a resource

### Social Media
- `GET /api/disasters/:id/social-media` - Get social media posts for a disaster
- `POST /api/disasters/:id/social-media` - Add social media post

### Image Verification
- `POST /api/disasters/:id/verify-image` - Upload and verify disaster images

## Environment Variables

Create a `.env` file in the server root with the following variables:

```env
SUPABASE_URL= your-supabase-url
SUPABASE_KEY= your-supabase-key
GEMINI_API_KEY= your-gemini-key
MAPBOX_API_KEY= your-api-key
BLUESKY_USERNAME= your-username
BLUESKY_APP_PASSWORD= your-app-password


```

## Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables (see above)
5. Start the development server:
   ```bash
   npm start
   ```

## Development

- The server runs on `http://localhost:9897` by default
- Uses ES modules (import/export syntax)
- Implements CORS for cross-origin requests
- Includes request body size limit (10MB) for file uploads

## Real-time Features

The server uses Socket.IO for real-time communication. The following events are supported:

- `disaster:created` - Emitted when a new disaster is created
- `disaster:updated` - Emitted when a disaster is updated
- `disaster:deleted` - Emitted when a disaster is deleted

## Error Handling

All API routes include error handling middleware that returns appropriate HTTP status codes and error messages in JSON format.

## License

This project is proprietary and confidential. All rights reserved.
