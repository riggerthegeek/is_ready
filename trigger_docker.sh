#!/usr/bin/env bash

docker --version

docker login --username "$DOCKER_USERNAME" --password "$DOCKER_PASSWORD"

docker build -t "$DOCKER_USERNAME/$DOCKER_PACKAGE" .
docker tag "$DOCKER_USERNAME/$DOCKER_PACKAGE" "$DOCKER_USERNAME/$DOCKER_PACKAGE:$(cat package.json | json version)"

docker push "$DOCKER_USERNAME/$DOCKER_PACKAGE"
