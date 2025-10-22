# Docker Deployment Guide

This guide explains how to build and run CarbonControl using Docker.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose (optional, for simplified deployment)

## Quick Start

### Using Make (Recommended)

If you have `make` installed, you can use the provided Makefile for simplified commands:

```bash
# Build the image
make build

# Run the container
make run

# View logs
make logs

# Stop the container
make stop

# See all available commands
make help
```

### Using Docker

1. **Build the Docker image:**
   ```bash
   docker build -t carboncontrol:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 carboncontrol:latest
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

### Using Docker Compose

1. **Build and start the application:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

## Production Deployment

### Environment Variables

You can pass environment variables to the container using the `-e` flag:

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  carboncontrol:latest
```

Or create a `.env.production` file and use it with Docker Compose by uncommenting the `env_file` section in `docker-compose.yml`.

### Custom Port

To run the application on a different port:

```bash
docker run -p 8080:3000 carboncontrol:latest
```

This maps port 8080 on your host to port 3000 in the container.

### Health Checks

The application runs on port 3000 by default. You can verify it's running with:

```bash
curl http://localhost:3000
```

## Image Details

- **Base Image:** node:22-alpine
- **Architecture:** Multi-stage build for optimized image size
- **User:** Runs as non-root user (nextjs:1001) for security
- **Port:** 3000

## Multi-stage Build

The Dockerfile uses a 3-stage build process:

1. **deps:** Installs production dependencies only
2. **builder:** Installs all dependencies and builds the Next.js application
3. **runner:** Creates the final minimal image with only necessary files

This approach significantly reduces the final image size while maintaining all required functionality.

## Troubleshooting

### Build fails with network errors

If you encounter network errors during build (e.g., fetching fonts), you may need to configure Docker to use a different DNS server or retry the build.

### Permission issues

If you encounter permission issues, ensure Docker has proper permissions on your system and the Dockerfile creates the correct user.

### Container exits immediately

Check container logs:
```bash
docker logs <container-id>
```

## Advanced Usage

### Building for specific platforms

To build for a specific platform (e.g., ARM64):
```bash
docker build --platform linux/arm64 -t carboncontrol:latest .
```

### Multi-platform build

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t carboncontrol:latest .
```

### Volume mounts (for development)

Not recommended for production, but useful for development:
```bash
docker run -p 3000:3000 -v $(pwd):/app carboncontrol:latest
```

## Security Considerations

- The container runs as a non-root user (nextjs)
- Minimal alpine-based image reduces attack surface
- Production dependencies only in final image
- No sensitive information included in the image

## License

MIT - Same as the main project
