#!/usr/bin/env bash

curl -H "Content-Type: application/json" --data '{"docker_tag": "master"}' -X POST "$DOCKER_WEBHOOK"
curl -H "Content-Type: application/json" --data "{\"docker_tag\": \"$(cat package.json | json version)\"}" -X POST "$DOCKER_WEBHOOK"
