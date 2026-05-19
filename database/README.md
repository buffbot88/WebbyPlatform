# Database Folder

This directory contains encrypted JSON database files used by WebbyPlatform.

- Store files are encrypted and should not be edited manually.
- The folder must not be directly accessible from the web.
- Backup the `database/` folder regularly.
- Each store is stored in a file named `database/{store}.enc`.
- The files are managed by `api/data.php` only.
