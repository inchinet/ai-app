# AI App Linux Deployment Guide (PHP Edition)

This guide describes how to deploy the AI application to your Linux server using the **Zero Config** PHP method. 

## 1. Prerequisites
- Apache2 with `php` and `rewrite` modules enabled.
- No need for Node.js or NPM on the server!

## 2. Prepare the Application (On your PC)
In your local project folder (`z:\antigravity\AI\ai-app`), run:
```powershell
npm run build
```
This generates a `dist` folder containing your compiled website.

### 3. Upload to Server
Upload the following to your server (e.g., at `/var/www/nextcloud/ai-app`):

1.  **Contents of `dist/`** -> Upload to `/ai-app/` (so `index.html` is at the root)
2.  **`server/`** folder -> Upload to `/ai-app/server/`
3.  **`.htaccess`** -> Upload to `/ai-app/.htaccess`

**Server folder structure should look like this:**
```text
/var/www/nextcloud/ai-app/
├── .htaccess            (Handles routing)
├── index.html           (From dist/ folder)
├── assets/              (From dist/ folder)
├── server/              (The backend folder)
│   ├── api.php          (The "Secretary" script)
│   └── data/            (Created by script)
└── uploads/             (Link to server/uploads via .htaccess)
```

## 4. Apache Configuration
If you uploaded the files to `/var/www/nextcloud/ai-app`, you just need to ensure the `Alias` is set up in your Apache config so that `https://inter-net.no-ip.com/ai-app` points to that folder.

Add this to your `<VirtualHost *:443>`:

```apache
    # AI App Entry Point
    Alias /ai-app /var/www/nextcloud/ai-app
    <Directory /var/www/nextcloud/ai-app>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
```

> [!IMPORTANT]
> **No ProxyPass needed!** PHP is handled natively by Apache. 
> The `.htaccess` file you uploaded handles the rest of the magic.

## 5. Set Permissions
Ensure the server can write to the data and uploads folders:
```bash
sudo chown -R www-data:www-data /var/www/nextcloud/ai-app/server
sudo chmod -R 775 /var/www/nextcloud/ai-app/server
```
sudo chown -R www-data:www-data /var/www/nextcloud/ai-app/

## 6. Restart Apache
```bash
sudo systemctl restart apache2
```

---
**Done!** Your app is now running with zero background processes.
