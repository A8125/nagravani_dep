

---

##  Features

- **Premium UI/UX**: Built with Framer Motion and Radix UI for smooth, glassmorphic interactions.
- **Real-time Agents**: Advanced agentic workflows integrated with a custom inspection plugin.
- **Multi-Channel Communication**: Support for WhatsApp integration via `whatsapp-web.js` and Twilio.
- **Dynamic Dashboards**: Interactive charts using Recharts and geographic mapping with Leaflet.
- **Secure Backend**: Express.js server with Supabase for cloud storage and SQLite for local caching.
- **Automated Workflows**: File upload handling with Multer and unique ID generation with UUID.

---

##  Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Components**: [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **State/Data**: Supabase JS, React Hook Form, Zod

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: Express.js
- **Database**: Supabase + Better-SQLite3
- **Integrations**: WhatsApp-Web.js, Twilio, Multer

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/christopherbatemen-ai/puttanaiha-foundation.git
   cd puttanaiha-foundation
   ```

2. **Setup Frontend**:
   ```bash
   cd app
   npm install
   npm run dev
   ```

3. **Setup Backend**:
   ```bash
   cd ../backend
   npm install
   npm run dev
   ```

---

## Project Structure

```text
.
├── app/                # React Frontend (Vite)
│   ├── src/            # Source code
│   └── public/         # Static assets
├── backend/            # Node.js Express Server
│   ├── uploads/        # File upload storage
│   └── server.js       # Main entry point
└── README.md           # Project documentation
```

---

## License

This project is licensed under the ISC License.

---

Built for the **Puttanaiha Foundation** team.
