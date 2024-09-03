#!/bin/bash

PROJECT_ROOT=$(pwd)
echo "Build tool project root directory: $PROJECT_ROOT"
BASE_APP_NAME="ssbi"
BUILD_DIR="../.build"
BUNDLE_DIR="$BUILD_DIR/bundle"
VERSION=$(date +%Y%m%d-%H%M)
DOCKER_TAG="qhose/$BASE_APP_NAME:$VERSION"
echo "Creating a new docker image, and publish it to docker hub: $DOCKER_TAG"

remove_path_to_long_directory() {
    local directory=$1
    # create a temporary (empty) directory
    local parent=$(mktemp -d)
    rsync -a --delete "$parent/" "$directory/"
    rm -rf "$directory"
    rm -rf "$parent"
}

echo "STEP delete old build files"
remove_path_to_long_directory "$BUILD_DIR"

echo "STEP build new meteor bundle"
meteor build --architecture=os.linux.x86_64 --allow-superuser --directory "$BUILD_DIR"

echo "STEP copy dockerfile to bundle folder, so docker can build the image"
cp Dockerfile "$BUNDLE_DIR"
cp startNode.sh "$BUNDLE_DIR"

echo "STEP go to bundle dir"
cd "$BUNDLE_DIR"

echo "STEP build the Dockerfile (which has been copied already in the bundle dir)"
echo "STEP Building Dockerfile via command: docker build -t $DOCKER_TAG"
docker build -t "$DOCKER_TAG" .

echo "docker push $DOCKER_TAG"
docker push "$DOCKER_TAG"

# at the end, go back to the folder where we started
cd "$PROJECT_ROOT"