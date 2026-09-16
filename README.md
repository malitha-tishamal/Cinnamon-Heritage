# 🌿 Cinnamon Heritage — Digital Business Platform

> A production-grade full-stack digital platform developed for **Cinnamon Heritage**, a Ceylon cinnamon estate in Galle, Sri Lanka.

Cinnamon Heritage was developed to transform a traditional business website into an integrated digital business ecosystem, connecting **brand storytelling, e-commerce, inventory, order management, customer management, B2B services, tourism experiences, CMS, and analytics** within a single platform.

## 🚀 Overview

The platform provides a complete digital solution for managing both customer-facing experiences and core business operations.

### Platform Ecosystem

```text
Brand
  ↓
Products
  ↓
E-Commerce
  ↓
Inventory
  ↓
Orders
  ↓
Customers
  ↓
B2B Inquiries
  ↓
Tourism Experiences
  ↓
CMS
  ↓
Analytics
```

## ✨ Key Features

### 🛒 E-Commerce

* Product catalog and product management
* Shopping cart and checkout
* Real-time order management
* Multiple payment configuration options
* COD and bank transfer support
* Dynamic district-based delivery rates

### 📦 Inventory & Order Management

* Real-time inventory tracking
* Transaction-safe stock deduction
* Atomic order processing
* Multi-stage order tracking
* Product stock management
* Order status management

### 📊 Admin Dashboard

* Business overview dashboard
* Sales analytics
* Real-time KPIs
* Order monitoring
* Customer management
* Product and inventory management
* Business insights

### 📝 Dynamic CMS

* Manage website content without code changes
* Dynamic pages and sections
* Product and media management
* Content updates through the administration panel

### 🤝 B2B & Wholesale

* Wholesale inquiry management
* Export inquiries
* Business customer management
* Inquiry tracking

### 🌴 Tourism & Hospitality

* Factory tour inquiries
* Eco-villa inquiries
* Tourism experience management
* Customer inquiry handling

### 🔐 Authentication & Authorization

* Firebase Authentication
* Role-based access control
* Admin approval workflow
* Protected administrative features

### 🖼️ Media Management

* Cloudinary-powered media storage
* CDN-based image delivery
* Product image management
* Dynamic website media

### 📱 Responsive Experience

* Mobile-friendly interface
* Tablet and desktop support
* Responsive customer experience
* Bootstrap-based UI architecture

---

## 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap 5

### Backend

* Node.js
* Express.js
* REST APIs

### Database & Cloud

* Firebase Authentication
* Cloud Firestore
* Cloudinary

### Libraries & Services

* Chart.js
* bcrypt
* Vercel

---

## ⚙️ Technical Architecture

The application follows a modular full-stack architecture designed for maintainability and scalability.

```text
┌───────────────────────────────┐
│        Customer Frontend      │
│      HTML / CSS / JS /        │
│          Bootstrap 5          │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│       Node.js / Express       │
│        Backend Services       │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Firestore   │  │  Cloudinary  │
│  Database    │  │  Media / CDN │
└──────────────┘  └──────────────┘
```

## 🔥 Technical Highlights

* RESTful backend architecture using Node.js and Express.js
* Real-time Firestore listeners for dynamic application data
* Firestore ACID transactions for reliable order processing
* Atomic inventory and stock deduction
* Firebase Authentication with role-based authorization
* Cloudinary CDN architecture for scalable media delivery
* Modular backend and frontend structure
* Optimized Firestore queries and API operations
* Real-time dashboard metrics and business analytics
* Cloud-based architecture deployed through Vercel

---

## 🔄 Order Processing

The platform uses transaction-based processing to maintain inventory consistency during order creation.

```text
Customer Places Order
        ↓
Validate Order Data
        ↓
Check Product Availability
        ↓
Firestore Transaction
        ↓
Create Order
        +
Deduct Stock Atomically
        ↓
Update Order Status
        ↓
Customer Order Tracking
```

This approach helps prevent inconsistent inventory states when multiple operations interact with the same stock data.

---

## 🔐 Security

Security-related implementation includes:

* Firebase Authentication
* Role-based access control
* Admin authorization
* Protected API operations
* Password hashing using bcrypt
* Server-side validation
* Controlled Firestore access

---

## 📈 Business Capabilities

The system brings several previously separated business functions into one platform:

| Business Area  | Capability                            |
| -------------- | ------------------------------------- |
| E-Commerce     | Products, cart, checkout, orders      |
| Inventory      | Stock tracking and management         |
| Sales          | Dashboard and analytics               |
| Customers      | Customer and order management         |
| B2B            | Wholesale and export inquiries        |
| Tourism        | Factory tours and eco-villa inquiries |
| CMS            | Dynamic website content               |
| Media          | Cloudinary-based asset management     |
| Administration | Role-based management                 |
| Delivery       | District-based delivery rates         |

---

## 🌐 Live Website

**Cinnamon Heritage**

https://cinnamonheritage.lk

---

## 👨‍💻 Developer

**Malitha Tishamal**

Full-Stack Developer | Software Developer | DevOps

Designed and developed as a client project for Cinnamon Heritage.

---

## 📌 Project Focus

This project demonstrates practical experience in:

* Full-Stack Web Development
* REST API Development
* E-Commerce Architecture
* Cloud Application Development
* Firebase & Firestore
* Real-Time Data Systems
* Transaction-Safe Database Operations
* Authentication & Authorization
* Inventory Management
* CMS Development
* Business Analytics
* Cloud Media Management
* Responsive Web Development

---

## 📄 License

This repository contains project source code developed for a client project.
Usage, redistribution, and commercial use are subject to the project's applicable ownership and licensing terms.
