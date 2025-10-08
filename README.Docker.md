# IELTS Mock Backend - Docker Configuration

This project includes Docker configuration for easy deployment and development.

## Prerequisites

- Docker
- Docker Compose

## Setup

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd ielts-mock/backend
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update the environment variables in `.env` file with your actual values.**

## Development

### Run in development mode:
```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Production

### Run in production mode:
```bash
# Build and start production environment
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop production environment
docker-compose down
```

## Available Services

### Development (docker-compose.dev.yml):
- **app-dev**: Node.js application with hot reload
- **mongo**: MongoDB database
- **redis**: Redis cache

### Production (docker-compose.yml):
- **app**: Node.js application
- **mongo**: MongoDB database  
- **redis**: Redis cache
- **nginx**: Reverse proxy (optional)

## Ports

- **Application**: 4000
- **MongoDB**: 27017
- **Redis**: 6379
- **Nginx**: 80, 443 (production only)

## Docker Commands

### Build only:
```bash
# Development
docker-compose -f docker-compose.dev.yml build

# Production
docker-compose build
```

### Database Management:
```bash
# Access MongoDB shell
docker-compose exec mongo mongosh

# Backup database
docker-compose exec mongo mongodump --out /backup

# Access Redis CLI
docker-compose exec redis redis-cli
```

### Application Management:
```bash
# View application logs
docker-compose logs app

# Execute commands in app container
docker-compose exec app npm run test

# Restart specific service
docker-compose restart app
```

### Clean up:
```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove unused Docker objects
docker system prune -a
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `NODE_ENV`: production/development
- `PORT`: Application port (default: 4000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3

## Health Check

The application includes a health check endpoint at `/health` that verifies the application is running correctly.

## Volumes

- **mongo_data**: MongoDB persistent storage
- **redis_data**: Redis persistent storage
- **uploads**: File uploads directory

## Networks

- **ielts-network**: Production network
- **ielts-network-dev**: Development network

## Troubleshooting

1. **Port already in use:**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :4000
   
   # Change port in docker-compose.yml or .env file
   ```

2. **Permission denied:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Database connection issues:**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongo
   
   # Restart MongoDB
   docker-compose restart mongo
   ```

4. **Clear everything and start fresh:**
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up --build
   ```