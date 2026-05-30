# Sample App Documentation

## Overview

A simple REST API for managing products with FastAPI backend and React frontend.

## Architecture

- **Backend**: FastAPI (Python) with async PostgreSQL
- **Frontend**: React + TypeScript with Tailwind CSS
- **API**: RESTful endpoints under `/api/*`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List all products |
| POST | /api/products | Create a new product |
| GET | /api/products/:id | Get product by ID |
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |

## Data Flow

1. Client sends HTTP request to server
2. Server validates input and processes request
3. Server queries database (if needed)
4. Server returns JSON response
5. Client updates UI with response data

## Tech Stack

- Python 3.12 + FastAPI
- React 19 + TypeScript
- PostgreSQL 16
- Node.js HTTP server
