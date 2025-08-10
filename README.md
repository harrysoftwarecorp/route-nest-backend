# RouteNest Backend

A modern, feature-rich backend service for the RouteNest trip planning application, built with Node.js, Express, and MongoDB.

## 🚀 Features

### Trip Management

- ✅ Create, read, update, delete trips
- ✅ Rich trip metadata (categories, tags, visibility settings)
- ✅ Trip statistics and analytics
- ✅ Public/private trip sharing
- ✅ Trip templates and collaboration

### Stop Management

- ✅ Add, edit, delete, and reorder stops
- ✅ Multiple stop types (attractions, food, accommodation, etc.)
- ✅ Priority levels and completion tracking
- ✅ Cost estimation and notes
- ✅ Flexible scheduling with arrival/departure times

### Route Management

- ✅ Route generation between stops
- ✅ Multiple transport modes
- ✅ Distance and duration calculations
- ✅ Route optimization (basic implementation)

### Search & Discovery

- ✅ Trip search with filters
- ✅ Popular trips discovery
- ✅ Category and tag-based filtering
- ✅ Location-based search (basic)

### Legacy Support

- ✅ Backward compatibility with old API endpoints
- ✅ Data migration scripts
- ✅ Seamless transition from old schema

## 📋 API Endpoints

### Trip Management

```
GET    /api/trips              # Get all trips
GET    /api/trips/:id          # Get single trip
POST   /api/trips              # Create new trip
PUT    /api/trips/:id          # Update trip
DELETE /api/trips/:id          # Delete trip
```

### Stop Management

```
POST   /api/trips/:id/stops              # Add stop to trip
PUT    /api/trips/:id/stops/:stopId      # Update stop
DELETE /api/trips/:id/stops/:stopId      # Delete stop
PUT    /api/trips/:id/stops/reorder      # Reorder stops
PATCH  /api/trips/:id/stops/:stopId/status  # Mark stop complete/incomplete
```

### Route Management

```
POST   /api/trips/:id/routes/generate    # Generate routes
POST   /api/trips/:id/routes/optimize    # Optimize route
```

### Search & Discovery

```
GET    /api/trips/search                 # Search trips
GET    /api/trips/popular                # Get popular trips
```

### Legacy Endpoints (Backward Compatibility)

```
POST   /api/trips/legacy                 # Legacy trip creation
PUT    /api/trips/:id/stops              # Legacy stop addition
```

## 🏗️ Schema Structure

### Trip Schema

```javascript
{
  name: String,                    // Trip name
  description: String,             // Trip description
  userId: String,                  // Owner ID
  createdAt: Date,                // Creation timestamp
  updatedAt: Date,                // Last update timestamp
  startDate: Date,                // Trip start date
  endDate: Date,                  // Trip end date
  estimatedDuration: Number,      // Duration in days
  isPublic: Boolean,              // Public visibility
  isTemplate: Boolean,            // Template flag
  category: String,               // Trip category
  tags: [String],                 // Trip tags
  visibility: String,             // Visibility level
  sharedWith: [String],           // Shared user IDs
  rating: Number,                 // Trip rating
  reviewCount: Number,            // Number of reviews
  stops: [StopSchema],            // Trip stops
  routes: [RouteSchema],          // Route segments
  stats: StatsSchema              // Trip statistics
}
```

### Stop Schema

```javascript
{
  id: Number,                     // Unique stop ID
  tripId: String,                 // Parent trip ID
  name: String,                   // Stop name
  description: String,            // Stop description
  lat: Number,                    // Latitude
  lng: Number,                    // Longitude
  address: String,                // Full address
  plannedArrival: Date,           // Planned arrival time
  plannedDeparture: Date,         // Planned departure time
  estimatedDuration: Number,      // Duration in minutes
  stopType: String,               // Stop type enum
  priority: String,               // Priority level
  cost: Number,                   // Estimated cost
  notes: String,                  // Additional notes
  order: Number,                  // Stop order in trip
  isCompleted: Boolean,           // Completion status
  isSkipped: Boolean              // Skip status
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB (v4.4+ recommended)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd route-nest-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
# Create .env file
PORT=8000
MONGODB_URI=mongodb://localhost:27017/route-nest
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

4. **Start MongoDB**

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud service
```

5. **Run the development server**

```bash
npm run dev
```

The server will start on `http://localhost:8000`

### Production Deployment

```bash
# Build and start production server
npm start
```

## 🔄 Data Migration

If you have existing data from the old schema, use the migration script:

### Migrate existing data

```bash
npm run migrate
```

### Rollback migration (if needed)

```bash
npm run migrate:rollback
```

The migration script will:

- ✅ Transform old trip data to new schema
- ✅ Add default values for new required fields
- ✅ Preserve existing data integrity
- ✅ Add migration tags for tracking
- ✅ Generate trip statistics

## 🧪 Testing

### Manual API Testing

You can test the API using tools like Postman, curl, or any HTTP client:

```bash
# Get all trips
curl http://localhost:8000/api/trips

# Create a new trip
curl -X POST http://localhost:8000/api/trips \
  -H "Content-Type: application/json" \
  -d '{"name":"My Trip","estimatedDuration":3,"category":"city_exploration"}'

# Add a stop to a trip
curl -X POST http://localhost:8000/api/trips/{tripId}/stops \
  -H "Content-Type: application/json" \
  -d '{"name":"Ben Thanh Market","lat":10.7722,"lng":106.698,"plannedArrival":"2024-01-01T09:00:00Z","estimatedDuration":120,"stopType":"shopping","priority":"high"}'
```

## 📊 Database Indexes

The following indexes are automatically created for optimal performance:

- `userId + createdAt` (compound, descending)
- `category + isPublic` (compound)
- `tags` (multikey)
- `stats.totalDistance` (single)
- `rating` (descending)

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request** - Invalid request data
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server errors

All errors return JSON with descriptive error messages:

```json
{
  "error": "Trip not found",
  "message": "No trip exists with the provided ID"
}
```

## 🔧 Configuration

### Environment Variables

| Variable       | Description               | Default                                |
| -------------- | ------------------------- | -------------------------------------- |
| `PORT`         | Server port               | `8000`                                 |
| `MONGODB_URI`  | MongoDB connection string | `mongodb://localhost:27017/route-nest` |
| `FRONTEND_URL` | Frontend URL for CORS     | `http://localhost:5173`                |
| `NODE_ENV`     | Environment mode          | `development`                          |

### MongoDB Configuration

For production, consider:

- Setting up MongoDB Atlas or managed MongoDB service
- Configuring proper connection pooling
- Setting up database backups
- Implementing proper security measures

## 📈 Performance Considerations

### Database Optimization

- Proper indexing for common queries
- Pagination for large datasets
- Efficient aggregation pipelines for statistics

### API Optimization

- Input validation and sanitization
- Request rate limiting (to be implemented)
- Caching for frequently accessed data
- Compression for responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:

- Open an issue in the repository
- Check the API documentation
- Review the migration guide for data transitions

---

**Note**: This backend is designed to work seamlessly with the RouteNest frontend React application. Make sure both services are running for full functionality.
