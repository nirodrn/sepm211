# SEPM211 - Supply Chain & Production Management System

A comprehensive Enterprise Resource Planning (ERP) and Supply Chain Management (SCM) solution designed to streamline operations across production, warehousing, inventory management, and sales.

## 🚀 Overview

This application serves as a centralized platform for managing the entire lifecycle of manufacturing and distribution. It connects various departments including Warehouse Operations, Production, Packing, Finished Goods, and Administration through a role-based interface.

## ✨ Key Features

### 🏭 Production Management
- **Batch Management**: Create, monitor, and track production batches.
- **Quality Control**: Record and track QC data for production stages.
- **Raw Material Requests**: Request materials from the warehouse directly.
- **Handover**: Seamless handover processes to the Packing Area.

### 📦 Warehouse Operations
- **Raw & Packing Materials**: Manage stock levels, requests, and supplier allocations.
- **Procurement**: Handle Purchase Orders (PO), Goods Received Notes (GRN), and Invoices.
- **Quality Control**: QC checks for incoming deliveries and raw materials.
- **Payments**: Track and record payments for invoices.

### 🎁 Packing Area & Store
- **Stock Management**: Track packing materials and finished products.
- **Packaging**: Manage product packaging and variants.
- **Dispatches**: Handle internal transfers to the Finished Goods Store.

### 🏪 Finished Goods Store
- **Inventory Control**: Real-time tracking of finished goods and storage locations.
- **Sales & Dispatches**: Manage external dispatches, direct shop requests, and claim dispatches.
- **Pricing**: Manage product pricing and view price history.

### 👮 Admin & Control
- **User Management**: Role-based access control (RBAC) and user administration.
- **Permission Control System (PCS)**: Granular permission settings for specific pages and actions.
- **Master Data**: Manage suppliers, products, materials, and material types.
- **Reports**: Comprehensive reports on supplier performance, stock analysis, and sales.

### 👔 Head of Operations & Management
- **Approval Queue**: Centralized approval system for requests and critical actions.
- **Monitoring**: Supplier monitoring and high-level dashboards.

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) & JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend / Database**: [Firebase](https://firebase.google.com/) (Realtime Database, Auth)
- **Routing**: [React Router](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: jsPDF
- **Excel Export**: xlsx

## ⚙️ Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd sepm211-1
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Ensure you have the necessary Firebase configuration. The app expects a Firebase project to be linked.
    *Note: Check `firebase.json` and `.firebaserc` for project details.*

## 🚀 Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## 🏗️ Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── components/     # Reusable UI components (Layout, Common, etc.)
├── constants/      # App-wide constants
├── firebase/       # Firebase configuration and initialization
├── hooks/          # Custom React hooks (useAuth, useRole, etc.)
├── pages/          # Application pages organized by module
│   ├── Admin/
│   ├── Auth/
│   ├── DataEntry/
│   ├── FinishedGoodsStore/
│   ├── HeadOfOperations/
│   ├── MainDirector/
│   ├── PackingArea/
│   ├── PackingMaterialsStore/
│   ├── Production/
│   ├── ReadOnlyAdmin/
│   └── WarehouseOperations/
├── services/       # API services for Firebase interactions
├── utils/          # Utility functions
├── App.tsx         # Main application component with Routing
└── main.tsx        # Entry point
```

## 🔐 Roles & Permissions

The application uses a dual-layer security model:
1.  **Role-Based Access**: Users are assigned roles which grant access to specific dashboards and routes. The system implements **10 distinct roles**:
    - **Admin**: Full system access.
    - **ReadOnlyAdmin**: View-only access to admin features.
    - **MainDirector**: Strategic oversight and high-level approvals.
    - **HeadOfOperations**: Operational oversight and approvals.
    - **WarehouseStaff**: Manage raw materials, POs, and GRNs.
    - **ProductionManager**: Oversee production batches and manufacturing.
    - **PackingAreaManager**: Manage packing operations and stock.
    - **FinishedGoodsStoreManager**: Manage finished inventory and sales.
    - **PackingMaterialsStoreManager**: Manage packing material inventory.
    - **DataEntry**: Restricted access for data input tasks.

2.  **Permission Control System (PCS)**: Allows for fine-grained access control to specific pages, even overriding default role restrictions if configured.

## 📄 License

[MIT License](LICENSE)
