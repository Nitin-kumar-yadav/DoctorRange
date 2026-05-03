# DoctorRange
# Hospital Management System (HMS) - Database API

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)

**Author:** Nitin Kumar Yadav

## 📝 Project Overview
This project provides a robust, scalable backend architecture for a comprehensive multi-tenant Hospital Management System. It is designed to streamline administrative and clinical operations across multiple hospital branches, handling everything from user role management (Managers, Staff, Doctors) to complex patient scheduling and medical history tracking. 

Built with the MERN stack, this backend leverages a document-based NoSQL architecture to ensure high performance, flexibility, and easy integration with modern frontend applications.

## 🗄️ Database Architecture Summary

The database is built on **MongoDB** utilizing **Mongoose schemas**. The architecture has been carefully structured to balance the flexible nature of document databases with the relational data requirements of a complex medical facility. 

Instead of relying on rigid, hardcoded arrays, the system uses a combination of embedded documents and normalized collections to ensure the database can scale without hitting document size limits or query bottlenecks.

### Core Domain Models

#### 1. Facility & Administration
* **`Hospital`**: The foundational entity. All staff, patients, and appointments are tied to a specific hospital ID, allowing this single database to serve multiple hospital locations simultaneously.
* **`Manager`**: High-level administrative users responsible for hospital oversight.
* **`Staff`**: Operational users (e.g., receptionists, nurses, admins) who handle day-to-day tasks like patient registration.

#### 2. Clinical Operations
* **`Doctor`**: Medical professionals linked to specific hospitals, complete with specializations and qualifications.
* **`Patient`**: The central entity for all medical data. Patients are registered by staff and linked to their respective hospital branch.
* **`Appointment`**: The transactional bridge of the system. It connects a `Patient`, a `Doctor`, and a `Hospital` at a specific date and time, tracking the status and clinical notes of the visit.

#### 3. Medical Records & History
To prevent database bloat and ensure fast query times, patient medical data is structurally segmented:
* **`Disease`**: A master dictionary of known diseases and descriptions.
* **`PatientDisease`**: Tracks specific diagnoses for patients over time.
* **`PreviousHistory`**: A dedicated collection for logging past illnesses and medications.
* **`CurrentMedicine`**: Tied directly to an `Appointment` and `Patient`, tracking active prescriptions, dosages, and expiry dates.
* **`Report`**: Handles medical files (X-rays, blood panels, etc.). Because these can be large, they are stored in their own collection referencing the patient and the generating appointment.

## 🚀 Key Features

* **Multi-Tenant Ready:** Natively supports multiple hospitals operating under one centralized system.
* **Role-Based Access Control (RBAC):** Distinct schemas for Managers, Staff, and Doctors allow for granular security and permission handling at the API level.
* **Scalable Medical Records:** Continuous data (like reports and prescriptions) are separated into their own collections to maintain high query performance and avoid MongoDB document size limits.
* **Comprehensive Audit Trail:** Built-in `created_at` timestamps across all major schemas ensure every action, registration, and appointment is thoroughly tracked.

## 💻 Getting Started

### Prerequisites
* Node.js installed on your local machine
* A MongoDB instance (local or MongoDB Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/yourusername/your-repo-name.git](https://github.com/yourusername/your-repo-name.git)
