#!/bin/bash

# Docker build and run script for test-appId-pay-example

set -e

IMAGE_NAME="primuslabs/test-appid-pay-example:latest"
CONTAINER_NAME="test-appid-pay-example"
PORT=8080

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build the Docker image
build() {
    print_info "Building Docker image: $IMAGE_NAME"
    docker build -t $IMAGE_NAME .
    print_info "Build completed successfully!"
}

# Function to run the container
run() {
    # Check if container is already running
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        print_warn "Container $CONTAINER_NAME is already running"
        print_info "Stopping existing container..."
        stop
    fi

    # Remove existing container if it exists
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        print_info "Removing existing container..."
        docker rm -f $CONTAINER_NAME > /dev/null 2>&1
    fi

    print_info "Starting container: $CONTAINER_NAME"
    print_info "Application will be available at: http://localhost:$PORT"
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:80 \
        --restart unless-stopped \
        $IMAGE_NAME
    
    print_info "Container started successfully!"
    print_info "View logs with: docker logs -f $CONTAINER_NAME"
}

# Function to stop the container
stop() {
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        print_info "Stopping container: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME
        print_info "Container stopped"
    else
        print_warn "Container $CONTAINER_NAME is not running"
    fi
}

# Function to remove the container
remove() {
    stop
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        print_info "Removing container: $CONTAINER_NAME"
        docker rm $CONTAINER_NAME
        print_info "Container removed"
    else
        print_warn "Container $CONTAINER_NAME does not exist"
    fi
}

# Function to show logs
logs() {
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        docker logs -f $CONTAINER_NAME
    else
        print_error "Container $CONTAINER_NAME is not running"
        exit 1
    fi
}

# Function to rebuild and restart
rebuild() {
    print_info "Rebuilding and restarting..."
    build
    run
}

# Function to show status
status() {
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        print_info "Container $CONTAINER_NAME is running"
        docker ps -f name=$CONTAINER_NAME
    else
        print_warn "Container $CONTAINER_NAME is not running"
    fi
}

# Function to show help
help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build      Build the Docker image"
    echo "  run        Build and run the container"
    echo "  stop       Stop the running container"
    echo "  remove     Stop and remove the container"
    echo "  restart    Restart the container"
    echo "  logs       Show container logs (follow mode)"
    echo "  rebuild    Rebuild image and restart container"
    echo "  status     Show container status"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build       # Build the image"
    echo "  $0 run         # Build and run"
    echo "  $0 logs        # View logs"
    echo "  $0 stop        # Stop container"
}

# Main script logic
case "${1:-help}" in
    build)
        build
        ;;
    run)
        build
        run
        ;;
    stop)
        stop
        ;;
    remove)
        remove
        ;;
    restart)
        stop
        run
        ;;
    logs)
        logs
        ;;
    rebuild)
        rebuild
        ;;
    status)
        status
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        help
        exit 1
        ;;
esac
