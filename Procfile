# Railway Configuration Files

These files help Railway understand how to deploy your project.

## Procfile (optional, but helpful)

Create a file named `Procfile` (no extension) in your root directory:

```
web: node server.js
```

This tells Railway exactly how to start the server.

## .gitignore

Make sure you have a `.gitignore` file to exclude unnecessary files from GitHub:

```
node_modules/
.env
.env.local
npm-debug.log
.DS_Store
dist/
build/
```

## Environment Variables (optional)

If you need to customize the port:

1. In Railway dashboard, go to your project
2. Click "Variables"
3. Add: `PORT=3000` (or any port you want)

Your `server.js` already handles this:
```javascript
const PORT = process.env.PORT || 3000;
```

## package.json

Make sure your `package.json` has:

```json
{
  "name": "wifi-dashboard",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2"
  }
}
```

Railway will automatically run `npm install` and `npm start`.
