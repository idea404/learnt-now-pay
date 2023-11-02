#!/bin/bash

# Requires:
# - ETN to be running
# - Python 3.10+
# - yarn
# - env variables to be set

# Set NODE_ENV to test
export NODE_ENV=test

# Install dependencies
yarn install --frozen-lockfile

# Compile
yarn compile

# Deploy
yarn deploy && yarn deploy:multiplier

# Run demo
yarn demo

# Install requirements
pip install -r server/requirements.txt

# Run server
python server/src/main.py

# Run payout
yarn payout
