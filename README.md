# AI Portfolio App (PHP Edition)

A dynamic portfolio website built with **React (Vite)** and a lightweight **PHP** backend.

## 🚀 "Zero Config" Advantages
*   **Simple Deployment**: No Node.js or NPM needed on your Linux server.
*   **No PM2/Background Tasks**: No background processes to manage or restart.
*   **Lightweight**: Only upload your files and they work instantly via Apache + PHP.

## 📁 Local Development
To work on this project locally on your Windows PC:

1.  **Install Dependencies** (One-time):
    ```powershell
    npm install
    ```
2.  **Start Frontend**:
    ```powershell
    npm run dev
    ```
3.  **Local Backend**: 
    The app uses a **Mock Data** fallback if no backend is detected. To test saving/uploading locally, you would need a local PHP server (like XAMPP).

## 🔑 Admin Access & Google Login
To access the Admin interface:
1.  **Google Sign-In**: Authorized for your gmail.
2.  edit /server/api.php, use your own:
    const ADMIN_EMAIL = '';
    const GOOGLE_CLIENT_ID = '';

## 🛠️ Deployment (To Linux)
1.  Run `npm run build` on your Windows PC.
2.  Upload `dist/`, `server/`, and `.htaccess` to your server.
3.  Ensure your server has write permissions for the `server/data/` and `server/uploads/` folders.
4.  See [DEPLOY.md](DEPLOY.md) for detailed step-by-step instructions.

## 📂 Project Structure
*   **`src/`**: React Frontend source code.
*   **`server/`**: PHP Backend (handles posts, uploads, and settings).
*   **`.htaccess`**: Handles URL mapping for `/api` and `/uploads`.
*   **`public/`**: Static assets.

## ✨ Features
*   **Admin Panel**: Manage your portfolio contents dynamically.
*   **Rich Text Editor**: Format text, add colors, insert images/videos, and embed YouTube.
*   **Server-Side Persistence**: Your banner and posts stay saved on the server in JSON format.
*   **SEO Optimized**: Semantic HTML and clean metadata.
