# 📅 School Platform : Event Management Module

This module represents the complete frontend implementation for the **Event Management System**. It provides a rich, responsive interface for users to browse, register for events, and manage their allocations, while ensuring robust controls via a dynamic waitlist system.

## 🚀 Key Features

### 1. Dynamic Seating & Registration (`events-user`)
- **Seating Chart**: A visual, cinema-style grid layout allowing users to select specific available seats.
- **Auto-Waitlist System**: 
  - Validates remaining capacity strictly against the backend counter.
  - Automatically routes users to a waitlist if capacity is reached (`Available Capacity <= 0`).
  - Seamlessly adjusts visual feedback (Green for Success vs. Orange for Waitlist).
- **Graceful Modal Interaction**: The UI maintains the registration modal open for 10 seconds post-waitlist assignment to ensure the user fully reads the instructional feedback.

### 2. Event Administration (`events-list` & `event-form`)
- **Capacity Management**: Intuitive administrative controllers for updating the event capacity.
- **Seat Decoding**: Calculates reserved seats by parsing existing registration blocks.
- **Intelligent Status Detection**: Case-insensitive parsing of backend API responses (`WAITLISTED`, `CONFIRMED`) to guide accurate frontend rendering.

### 3. QR Ticket Verification (`ticket-verification`)
- Allows administrative staff to scan and validate user attendance at the venue securely.

## 📂 Folder Structure

```text
events/
├── event-details/           # View for exploring deep event info
├── event-form/              # Form component used strictly for Admin event creation
├── events-list/             # Standard listing rendering all valid upcoming events
├── ticket-verification/     # Component utilized for scanning user QR code tickets
├── events-routing.module.ts # Navigation rules mapping child URLs
└── events.module.ts         # Module bundle registering event components
```

## 🛠️ Technical Details

- **Framework**: Built natively with Angular Standalone Components (or modular architecture) and optimized `@for` loops utilizing `$index` native tracking to prevent `NG0955` duplication errors.
- **CSS Preprocessor**: Styled exclusively using TailwindCSS for maximum flexibility and rapid responsive layout generation.
- **Backend Syncing**: Tightly coupled with the Spring Boot microservice `event-service`. Modifies capacities decrementally through API interaction.

## 💡 Usage Requirements
Before testing, ensure `event-service` is actively running via `localhost:8088` (or standard API Gateway port), as seating metrics stream directly from the remote database schema.
