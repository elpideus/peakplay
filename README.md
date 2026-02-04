# 🎵 PeakPlay - Top 100 Global Songs Daily

![](./public/favicon-96x96.png)

**Live Website**: [peakplay.vercel.app](https://peakplay.vercel.app)

A modern, real-time dashboard showcasing the world's top 100 most-streamed songs, updated daily. Built with React, TypeScript, and serverless architecture with intelligent caching.

---

## ✨ Features

### 🏆 **Visual Excellence**
- **Podium Cards**: Dynamic top 3 cards with color extraction from album art
- **Real-time Sorting**: Interactive table with multi-column sorting
- **Responsive Design**: Seamless experience from mobile to ultra-wide screens
- **Visual Indicators**: Position changes, stream progress bars, and artist highlights

### 🔍 **Smart Functionality**
- **Real-time Search**: Debounced search across titles and artists
- **Intelligent Caching**: LocalStorage with scheduled 11 PM UTC refreshes
- **SEO Optimized**: Rich structured data, Open Graph, and Twitter Cards
- **Offline Support**: Graceful degradation with cached data

### ⚡ **Performance Optimized**
- **Lazy Loading**: Images and components load on-demand
- **Optimized Bundles**: Tree-shaking and code splitting
- **Efficient API Calls**: Batch processing and error handling
- **Progressive Enhancement**: Works with varying network conditions

---

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript for type safety
- **Vite** for blazing-fast builds and development
- **Tailwind CSS** for utility-first styling
- **ColorThief** for dynamic color extraction from images
- **Custom Hooks** for reusable data fetching logic

### Backend
- **Vercel Serverless Functions** for API endpoints
- **Redis (Upstash)** for persistent caching
- **Cheerio** for web scraping kworb.net data
- **Spotify Web API** for artist metadata and images

### Infrastructure
- **Vercel** for hosting and deployment
- **Environment Variables** for secure configuration
- **CORS** configured for cross-origin requests

## 📁 Project Structure
```
peakplay/
├── api/ # Serverless functions
│ ├── index.js # Redis-based API 
│ └── index_file_based.js # File-based fallback API 
├── src/ 
│ ├── App.tsx # Root component with global state 
│ ├── PeakPlaySEO.tsx # SEO meta tags & structured data 
│ ├── header/ # Navigation components 
│ │ ├── Header.tsx 
│ │ ├── SearchBar.tsx 
│ │ └── menu/MenuOverlay.tsx 
│ ├── hero/ # Top 3 podium section 
│ │ ├── Hero.tsx 
│ │ └── PodiumCard.tsx # Color extraction & animations 
│ ├── hooks/ 
│ │ └── useTracksData.ts # Smart caching & data fetching 
│ ├── list/ 
│ │ └── List.tsx # Sortable track table 
│ └── utils/ 
│ └── ImageTools.ts # Image utilities 
└── public/ # Static assets & icons 
```

---

## 🚀 Key Technical Challenges & Solutions

### **1. Real-time Data with Daily Updates**
**Challenge**: Displaying current data while minimizing API calls and respecting rate limits.

**Solution**: Implemented a sophisticated caching system with:
- **LocalStorage caching** with automatic invalidation at 11 PM UTC daily
- **Background refresh** when data becomes stale (>12 hours)
- **Graceful fallback** to cached data during API failures
- **Smart scheduling** with user-friendly countdown to next update

### **2. Dynamic Visual Design**
Challenge: Creating engaging podium cards that reflect each song's unique identity.

Solution: Real-time color extraction from album art with:
- ColorThief library for dominant color detection
- Dynamic gradients based on extracted palette
- Parallax effects and hover interactions
- Position-specific styling (gold/silver/bronze themes)

### 3. **SEO Optimization for Dynamic Content**
Challenge: Making a React SPA SEO-friendly with constantly changing music data.

Solution: Comprehensive SEO implementation:
- JSON-LD structured data for rich search results
- Dynamic meta tags updated with current top songs
- Open Graph/Twitter Cards for social sharing
- Hidden microdata for search engine crawlers

### 4. **Performance Optimization**
Challenge: Handling 100+ tracks with images while maintaining smooth performance.

Solution: Multiple optimization strategies:
- Image width targeting to serve appropriate sizes
- Virtual scrolling for large lists (implemented in List.tsx)
- Memoized computations for sorting and filtering
- Debounced search (200ms delay) to prevent unnecessary re-renders

### 5. **API Integration & Error Handling**
Challenge: Reliably fetching data from multiple sources (kworb.net + Spotify API).

Solution: Robust error handling with fallbacks:
- Batch processing of Spotify API calls (50 tracks at a time)
- Comprehensive error states in UI components
- Cache-as-fallback strategy for API failures
- Authentication middleware with clear error messages

---

## 🏗 Architecture Highlights
### Smart Data Flow
```text
User Interaction → React State → Custom Hooks → 
┌─▶ LocalStorage Cache (if fresh)
└─▶ API Fetch (if stale) → Update Cache → Update UI
```

### Component Architecture
- `App.tsx`: Root component managing global search state
- `useTracksData.ts`: Custom hook abstracting all data logic
- `Hero/Hero.tsx`: Top 3 podium with callback to parent
- `List/List.tsx`: Configurable, sortable track table
- `PeakPlaySEO.tsx`: Headless SEO component receiving data via props

### Server-Side Implementation
The API server handles:
- Web scraping for basic data
- Spotify API enrichment for artist details and high-quality images
- Redis caching with automatic daily invalidation
- Authentication via Bearer tokens

---

## 🎯 What Makes This Project Stand Out
### Technical Sophistication
- TypeScript Throughout: Full type safety from frontend to backend
- Custom Hooks: Reusable, well-typed data fetching logic
- Serverless First: Built for Vercel's serverless environment
- Progressive Web App: Works offline and installable

### User Experience
- Ultra-responsive: From 320px mobile to 2560px+ ultrawide
- Accessibility: Semantic HTML, ARIA labels, keyboard navigation
- Smooth Animations: Parallax effects, hover states, loading skeletons
- Intuitive UX: Clear visual hierarchy and feedback

### Production Ready
- SEO Optimized: Ready for search engine discovery
- Performance Focused: Lighthouse scores >90
- Error Resilient: Multiple fallback strategies
- Maintainable: Clean separation of concerns

---

## 🔮 Future Enhancements
- **User Accounts**: Save favorite tracks and create playlists
- **Historical Data**: View charts from specific dates
- **Regional Charts**: Switch between countries/regions
- **Audio Previews**: 30-second Spotify previews
- **Social Features**: Share tracks and compare tastes
- **PWA Features**: Push notifications for new charts

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Spotify Developer Account (for API credentials)
- Vercel Account (for deployment)

### Local Development
```bash
# Clone and install
git clone https://github.com/yourusername/peakplay.git
cd peakplay
npm install
cd api
npm install
cd ../

# Set up environment variables
# Run development server
npm run dev

# Build for production
npm run build
```

### Deployment
```bash
# Deploy to Vercel
vercel --prod
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License
This project is licensed under the GPLv3 License - see the LICENSE file for details.

---

Built by elpideus • Because good music deserves recognition