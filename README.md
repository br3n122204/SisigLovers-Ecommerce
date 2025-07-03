# Sisig Lovers E-commerce

This is a simple e-commerce web app built with Next.js. It lets users browse products, add them to a cart, and checkout. There is also an admin area for managing products and orders.

## Features
- User authentication (login, profile)
- Browse products by brand or search
- Add products to cart
- Checkout with delivery and payment options (GCash, COD)
- Order history and order rating
- Admin dashboard for adding products and viewing orders
- Responsive design for mobile and desktop

## Tech Stack
- **Next.js** (React framework)
- **Firebase** (for database and authentication)
- **Supabase** (for image storage)
- **Tailwind CSS** (for styling)

## Getting Started

### 1. Install dependencies
```
npm install
```

### 2. Set up environment variables
- You need Firebase and Supabase credentials. Create a `.env.local` file and add your keys.

### 3. Run the development server
```
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `app/` - Main app pages (products, cart, checkout, admin, etc.)
- `components/` - Reusable UI components
- `context/` - State management (auth, cart)
- `lib/` - Firebase and Supabase setup
- `styles/` - Global and custom CSS

## Notes
- You need to set up your own Firebase and Supabase projects for this to work.
- This project is for learning and demo purposes.

---

Enjoy shopping with Sisig Lovers! 