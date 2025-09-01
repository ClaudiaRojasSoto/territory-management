# Territory Management Application

A Ruby on Rails application for managing and demarcating territories with interactive maps using Leaflet and OpenStreetMap.

## Features

- **Interactive Map Interface**: Built with Leaflet.js and OpenStreetMap for free map data
- **Territory Demarcation**: Draw and save main congregation zones and smaller territories
- **Geospatial Data**: Uses PostGIS for storing polygon boundaries and coordinates
- **User Management**: Devise-based authentication system
- **Territory Assignment**: Assign territories to users and track completion status
- **Printing System**: Print individual territories and main zones
- **Responsive Design**: Bootstrap 5 UI for mobile and desktop

## Prerequisites

- Ruby 3.2+
- PostgreSQL 12+ with PostGIS extension
- Node.js 16+ (for JavaScript bundling)
- Redis (optional, for Action Cable)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd territory-app
   ```

2. **Install Ruby dependencies**
   ```bash
   bundle install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup database**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed
   ```

5. **Start the server**
   ```bash
   rails server
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Main Territory Demarcation
1. Click "🗺️ Demarcate Main Zone" button
2. Click "🚀 Start" to begin demarcation
3. Click on the map to mark boundary points
4. Click "🔒 Close Polygon" when finished
5. Click "💾 Save Main Zone" to save

### Creating Smaller Territories
1. Ensure main zone is demarcated
2. Use the "Create New Territory" modal
3. Draw polygon boundaries within the main zone
4. Assign to users and set status

### Territory Management
- **Assigned**: Territory is currently being worked
- **Completed**: Territory work is finished
- **Returned**: Territory is back in circulation

## API Endpoints

### Territories
- `GET /api/v1/territories` - List all territories
- `POST /api/v1/territories` - Create new territory
- `GET /api/v1/territories/:id` - Get specific territory
- `PUT /api/v1/territories/:id` - Update territory
- `DELETE /api/v1/territories/:id` - Delete territory

### Territory Actions
- `POST /api/v1/territories/:id/assign` - Assign territory to user
- `POST /api/v1/territories/:id/return` - Return territory
- `POST /api/v1/territories/:id/complete` - Mark territory as completed

## Database Structure

### Territories Table
- `id`: Primary key
- `name`: Territory name
- `boundaries`: PostGIS polygon geometry
- `center`: PostGIS point geometry
- `status`: Current status (assigned, completed, returned)
- `assigned_to_id`: User ID if assigned
- `created_at`, `updated_at`: Timestamps

### Users Table
- `id`: Primary key
- `email`: User email
- `encrypted_password`: Devise encrypted password
- `created_at`, `updated_at`: Timestamps

## Technology Stack

- **Backend**: Ruby on Rails 7
- **Database**: PostgreSQL with PostGIS
- **Frontend**: HTML/ERB, Bootstrap 5, JavaScript
- **Maps**: Leaflet.js + OpenStreetMap
- **Authentication**: Devise
- **Geospatial**: RGeo, RGeo-GeoJSON

## Development

### Adding New Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/new-feature`
5. Create pull request

### Testing
```bash
# Run tests
rails test

# Run specific test file
rails test test/models/territory_test.rb
```

## Deployment

### Production Environment
1. Set `RAILS_ENV=production`
2. Configure production database
3. Set up environment variables
4. Run `rails assets:precompile`
5. Use production web server (Puma, Nginx)

### Docker (Optional)
```bash
docker build -t territory-app .
docker run -p 3000:3000 territory-app
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues, please create an issue in the GitHub repository.
