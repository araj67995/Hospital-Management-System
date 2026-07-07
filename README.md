# Hospital Management System

Complete MVC Hospital Management System built with HTML, CSS, JavaScript, Bootstrap 5, Node.js, Express.js, MongoDB, Mongoose, EJS, Express Session, bcrypt, Multer, PDFKit, Nodemailer, and dotenv.

## Folder Structure

```text
Hospital-Management-System/
|-- config/
|-- controllers/
|-- data/
|-- middleware/
|-- models/
|-- public/
|   |-- css/
|   |-- js/
|   `-- images/
|-- routes/
|-- uploads/
|   |-- profiles/
|   `-- reports/
|-- views/
|   |-- admin/
|   |-- auth/
|   |-- doctor/
|   |-- partials/
|   |-- patient/
|   `-- receptionist/
|-- .env
|-- app.js
|-- package.json
`-- README.md
```

## Installation

1. Install Node.js and MongoDB.
2. Start MongoDB locally.
3. Install dependencies:

```bash
npm install
```

4. Edit `.env` if your MongoDB URI or mail settings differ.
5. Seed sample data:

```bash
npm run seed
```

6. Run the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Sample Logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@carepoint.local | Admin@123 |
| Doctor | doctor@carepoint.local | Doctor@123 |
| Receptionist | reception@carepoint.local | Reception@123 |
| Patient | patient@carepoint.local | Patient@123 |

Admins create doctor login credentials from `Admin > Doctors` by entering the doctor's email and login password. New patients can create their own account from the `Create account` link on the login page.

To remove all sample section data while keeping the admin account:

```bash
npm run clear-defaults
```

## Features

- Session authentication with bcrypt password hashing.
- Admin dashboard with counts, charts, reports, notifications, and CRUD modules.
- Doctor dashboard with appointments, prescriptions, reports, diagnosis, and notes.
- Receptionist workflow for patient registration, appointments, admissions, discharge status, billing, and search.
- Patient dashboard for profile, appointments, prescriptions, reports, and invoice downloads.
- Mongoose schemas for users, doctors, patients, departments, appointments, admissions, rooms, medicines, bills, prescriptions, and reports.
- PDF invoice generation with PDFKit.
- File uploads for profile photos and medical reports with Multer.
- Flash messages, validation, responsive Bootstrap UI, searchable/sortable tables, and SweetAlert confirmations.
