## 🚀 GA4 / GTM DataLayer Overlay Bookmarklet

A lightweight in-browser tool to visualize `dataLayer` activity in real time — great for inspecting GA4 and GTM events without using GTM Preview Mode.

### 🔧 How to Install
Create a new bookmark in your browser and set its URL to:

```js
javascript:(()=>{fetch('https://raw.githubusercontent.com/silentpacific/no-gtm-datalayer-event-visualizer/main/ga4-overlay.js').then(r=>r.text()).then(eval).catch(e=>alert('Error loading overlay: '+e));})();
