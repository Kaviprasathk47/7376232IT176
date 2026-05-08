# Campus Notification System

A microservices-based notification platform built for college campuses, supporting high-throughput delivery for placements, results, and events.

## System Architecture

The project is structured into three main microservices/modules (with `notification_app_be` fully implemented):
- `notification_app_be`: Core backend handling user auth, notification routing, and WebSockets.
- `logging_middleware`: Separate service/module for centralized logging.
- `vehicle_maintence_scheduler`: Related campus microservice.

## Features
- **Real-time Push**: WebSockets (Socket.IO) for instant notifications.
- **Async Queueing**: BullMQ & Redis for decoupled processing (email, DB save, push).
- **High-Performance Priority Inbox**: Custom Min-Heap algorithm maintaining top 10 important notifications based on weight and recency.
- **Enterprise Security**: Rate limiting, Helmet headers, JWT authentication.
- **Caching**: Redis implementation for faster query resolution.

Please check `notification_system_design.md` for a complete breakdown of the architectural stages and database strategies.

## Getting Started

1. Set up a MongoDB and Redis server locally.
2. Navigate to `notification_app_be` and install dependencies.
3. Configure the `.env` based on `.env.example`.
4. Run `npm run dev` to start the backend.
