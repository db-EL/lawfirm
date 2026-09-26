# Firebase Hosting — Step-by-Step Deployment Guide
## Prof. Samuel Chisa Dike & Co. Website

---

## Prerequisites
- A Google account
- Node.js (v18+) installed — download from nodejs.org
- The website files (this folder)

---

## STEP 1 — Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it: `omuordu-chambers` (or any name you like)
4. Disable Google Analytics (optional for a static site)
5. Click **"Create project"**
6. Wait for it to finish, then click **"Continue"**

---

## STEP 2 — Install Firebase CLI

Open your **Terminal** (Mac/Linux) or **Command Prompt / PowerShell** (Windows):

```bash
npm install -g firebase-tools
```

Verify it installed:
```bash
firebase --version
```
You should see a version number like `13.x.x`

---

## STEP 3 — Log In to Firebase

```bash
firebase login
```

A browser window will open. Sign in with your Google account.
Come back to the terminal — you'll see: **"✔ Success! Logged in as your@email.com"**

---

## STEP 4 — Initialise Firebase in Your Project Folder

Navigate to your website folder:
```bash
cd path/to/lawfirm
```

*(Replace `path/to/lawfirm` with the actual path — e.g., `cd ~/Downloads/lawfirm`)*

Run:
```bash
firebase init hosting
```


```bash
firebase deploy
```

Wait 15–30 seconds. You'll see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/omuordu-chambers/overview
Hosting URL: https://omuordu-chambers.web.app
```

**Your site is now live!** 🎉

---

## STEP 7 — (Optional) Add a Custom Domain

If you have a domain like `omuorduchamberslaw.ng`:

1. In **Firebase Console** → **Hosting** → **Add custom domain**
2. Enter your domain name
3. Add the DNS records shown to your domain registrar
4. Wait up to 48 hours for DNS propagation
5. Firebase automatically provisions a free SSL certificate

---

## Updating the Site

Whenever you make changes to the files, just run:

```bash
firebase deploy
```

Your site updates in seconds.

---

## Quick Reference Commands

| Task | Command |
|---|---|
| Deploy | `firebase deploy` |
| Preview locally | `firebase serve` |
| View project | `firebase open hosting:site` |
| Check deploy history | `firebase hosting:channel:list` |

---

## Troubleshooting

**"firebase: command not found"**
→ Re-run `npm install -g firebase-tools` or try `npx firebase-tools deploy`

**"Permission denied"**
→ Run `firebase logout` then `firebase login` again

**Images not showing**
→ Ensure `prof-dike.jpg` is in the same folder as `index.html`

---

*Your website URL will be: `https://omuordu-chambers.web.app`*
*The `firebase.json` file in this folder is pre-configured for optimal caching and security.*
