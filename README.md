# DigiLocker Redesign — UI/UX Case Study & High-Fidelity Prototype

> **IMPORTANT DISCLAIMER**  
> This project is a **UI/UX redesign prototype concept and academic case study**, created for demonstration, hackathon, and presentation purposes. It is **NOT** an official Government of India or DigiLocker application. All data, student names, marksheets, registration numbers, and URLs are entirely fictional demo samples.

---

## 🌟 Overview

A complete, high-fidelity UI/UX redesign for India's digital document platform, shifting from an **issuer-centric navigation maze** to an intuitive **Task-First Architecture**:

$$\text{USER NEED} \longrightarrow \text{DOCUMENT} \longrightarrow \text{ACTION} \longrightarrow \text{CONFIRMATION}$$

### The 4 Major Hero Tasks
1. 📄 **Find a document** — Instant search, category filters & smart suggestions.
2. 📤 **Share a document** — Controlled sharing with granular permissions & auto-expiry timers.
3. ✓ **Verify a document** — Universal laser QR scanner & cryptographic integrity check.
4. ⬆ **Upload a document** — Private vault storage with transparent **`Not issuer-verified`** status tagging.

---

## 🚀 How to Run Locally

```bash
# 1. Open the project folder
cd /Users/dishapatil/Desktop/prototypebharatdigital

# 2. Start any static local server
python3 -m http.server 4173

# 3. Open in browser
open http://localhost:4173
```

---

## 📱 Features & Interactive Flows

- **22 Screens & States**: Welcome, Home Dashboard, My Documents, Categories, Real-time Search, Document Details, CBSE Class 12 Marksheet Preview with Watermark, Share Permissions, Share Success, QR Verifier Display, Laser Scanner, Verification Results, Upload Dropzone, Upload Status Explainer, Activity Timeline, Profile Settings, Empty States, and Error Handlers.
- **Viewport Simulator**: Switch between **Mobile (iPhone 15 Pro)**, **Tablet (iPad)**, **Desktop**, and **Fullscreen**.
- **Multi-Language Support**: Real-time translation between **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)**.
- **Web Audio API Feedback**: Synthesized micro-haptic clicks, scanning chirps, and success chimes.
- **Presentation Mode**: Quick flow switcher and interactive UX Case Study rationale drawer for hackathon judges.
