# DriveWise Docker Setup

This document provides instructions for running DriveWise using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Environment variables configured

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters

# Replit Auth Configuration (if using Replit Auth)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.com,localhost:5000
ISSUER_URL=https://replit.com/oidc

# Application Configuration
NODE_ENV=production
PORT=5000
```

## Development Setup

### Option 1: Full Stack with Database

Run the complete application with PostgreSQL and Redis:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

### Option 2: App Only (External Database)

If you have an external database (like Neon), use only the app service:

```bash
# Start only the application
docker-compose up app

# Or run in detached mode
docker-compose up -d app
```

## Production Deployment

### Using docker-compose.prod.yml

```bash
# Set environment variables
export DATABASE_URL="postgresql://user:pass@host:port/db"
export SESSION_SECRET="your-super-secret-key"
export REPL_ID="your-repl-id"
export REPLIT_DOMAINS="yourdomain.com"

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Using Docker only

```bash
# Build the image
docker build -t drivewise-app .

# Run the container
docker run -d \
  --name drivewise-app \
  -p 5000:5000 \
  -e DATABASE_URL="your-database-url" \
  -e SESSION_SECRET="your-session-secret" \
  -e REPL_ID="your-repl-id" \
  -e REPLIT_DOMAINS="your-domain.com" \
  drivewise-app
```

## Database Setup

### Using Neon (Recommended for Production)

1. Create a Neon database
2. Set the `DATABASE_URL` environment variable
3. The application will automatically run migrations

### Using Docker PostgreSQL (Development)

The `docker-compose.yml` includes a PostgreSQL container:

```bash
# Access the database
docker-compose exec postgres psql -U drivewise -d drivewise

# Run database migrations (if needed)
docker-compose exec app npm run db:push
```

## Health Checks

The application includes health checks:

- **Endpoint**: `GET /api/health`
- **Docker Health Check**: Runs every 30 seconds
- **Response**: JSON with status, timestamp, and service info

Check health status:

```bash
# Via curl
curl http://localhost:5000/api/health

# Via Docker
docker-compose ps
```

## Logs and Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Monitor Resources

```bash
# Container stats
docker stats

# Specific container
docker stats drivewise-app
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check database is running
   docker-compose ps postgres

   # Check database logs
   docker-compose logs postgres
   ```

2. **Application Won't Start**

   ```bash
   # Check application logs
   docker-compose logs app

   # Rebuild if needed
   docker-compose up --build app
   ```

3. **Port Already in Use**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "3000:5000"  # Use port 3000 instead
   ```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Session Secret**: Use a strong, unique session secret
3. **Database**: Use strong passwords and limit access
4. **Network**: Use Docker networks to isolate services
5. **Updates**: Regularly update base images

## Performance Optimization

1. **Multi-stage Build**: The Dockerfile uses multi-stage builds to minimize image size
2. **Node Modules**: Only production dependencies are included
3. **User Permissions**: Runs as non-root user
4. **Resource Limits**: Set in production compose file

## Production Checklist

- [ ] Environment variables configured
- [ ] Database backups scheduled
- [ ] Health checks enabled
- [ ] Logs configured
- [ ] Resource limits set
- [ ] Security updates scheduled
- [ ] Monitoring setup
- [ ] SSL/TLS configured (reverse proxy)

## Support

For issues with Docker setup, check:

1. Docker and Docker Compose versions
2. Available system resources
3. Network connectivity
4. Environment variable configuration
