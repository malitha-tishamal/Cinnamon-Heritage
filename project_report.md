# Cinnamon Heritage Project Report

## 🌿 Project Overview
**Cinnamon Heritage** is a professional e-commerce and brand showcase platform dedicated to high-quality cinnamon products. The project combines a modern, responsive user interface with a powerful administrative backend to manage sales, content, and customer relations.

---

## 🛠️ Technology Stack

### **Frontend (Client-Side)**
*   **HTML5 & CSS3**: Custom-built semantic structure and premium "light industrial" styling.
*   **JavaScript (ES6+)**: Handles dynamic data fetching, DOM manipulation, and interactive features.
*   **Bootstrap 5**: Provides a responsive grid system and pre-styled UI components like modals and buttons.
*   **Iconography & Typography**: Integrated with **FontAwesome** for icons and **Google Fonts** (Inter, Outfit) for a modern aesthetic.

### **Backend (Server-Side)**
*   **Node.js**: The core runtime environment.
*   **Express.js**: A minimalist web framework used to build the RESTful API and serve static files.
*   **Authentication & Security**:
    *   `bcryptjs`: Secure password hashing for admin accounts.
    *   `express-session`: Server-side session management for protected routes.
    *   `cors`: Configured to allow secure cross-origin requests.

### **Database (Data Layer)**
*   **MySQL**: A robust relational database management system.
*   **mysql2/promise**: An optimized Node.js driver for performing asynchronous database queries.

---

## 🚀 Core Functionalities

### **1. Public Website (Customer Experience)**
*   **Dynamic Product Catalog**: Products are fetched in real-time from the database, displaying up-to-date prices, discounts, and stock status.
*   **Interactive Production Process**: A dedicated section showcasing the journey of cinnamon through interactive cards and modals.
*   **Seamless Checkout Flow**:
    *   Dynamic delivery charge calculation based on the customer's Province and District.
    *   Stock validation to prevent over-ordering.
    *   Order placement with automated record-keeping.
*   **Communication Channels**:
    *   **Contact Form**: Integrated with the database to store and track customer inquiries.
    *   **WhatsApp Support**: A floating quick-access button for instant customer service.

### **2. Admin Panel (Management System)**
*   **Unified Dashboard**: Visualizes key metrics such as total earnings, order counts, and unread messages.
*   **Content Management System (CMS)**: Allows administrators to update website text (e.g., hero titles, descriptions) without touching code.
*   **Inventory & Product Control**: Full CRUD interface for products, including pricing, discount management, and stock updates.
*   **Order Tracking**: A comprehensive view of all sales with the ability to update order statuses (e.g., "Processing", "Shipped").
*   **Financial Analytics**:
    *   Revenue tracking (Daily, Monthly, and Yearly).
    *   Sales distribution by payment method and geographical location (Districts).
    *   Identification of best-selling products.
*   **Communication Hub**: Interface to read, mark, and delete messages sent via the contact form.

---

## 📂 Project Architecture

### **File Structure**
*   `/css`: Custom styling and Bootstrap overrides.
*   `/js`: Frontend logic (`main.js` for site-wide scripts, page-specific scripts for checkout/admin).
*   `/images`: Optimized assets for products and process steps.
*   `server.js`: The central entry point for the backend, containing API routes and database middleware.
*   `index.html`: The main customer-facing landing page.
*   `admin.html`: The secure portal for site management.
*   `database.sql`: The blueprint for the MySQL database schema.

---

## 🔒 Security Features
*   **Protected Routes**: All sensitive API endpoints (Admin CRUD, Stats) require an active, authenticated session.
*   **Password Protection**: Admin credentials are never stored in plain text, utilizing high-entropy salt and hashing.
*   **Transaction Safety**: Database transactions are used during checkout to ensure data integrity between order creation and stock reduction.
