# low poly waterfall

A stunning low poly waterfall scene created with **Three.js**, featuring dynamic water flow, realistic lighting, and lush vegetation. Perfect for showcasing 3D modeling and rendering techniques in a stylized environment.

## 🔗 Quick Links

- **🌐 Live Demo**: [low poly waterfall on Vercel](https://low-poly-waterfall.vercel.app) *(Deploy URL)*
- **💻 GitHub Repository**: [github.com/Debabrata-Giri-2001/low-poly-waterfall](https://github.com/Debabrata-Giri-2001/low-poly-waterfall)

---


### Environment & Visuals
- **Advanced Rendering**: WebGL 2 with custom shaders
- **Dynamic Lighting**: Emission lights, pool lights, fireflies
- **Detailed Objects**: Trees, flowers, grass, rocks, water,
- **Particle Systems**: Fireflies, wind lines

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Rendering** | Three.js | 0.183.2 |
| **Animation** | GSAP | 3.15.0 |
| **Build Tool** | Vite | 7.1.7 |
| **Language** | TypeScript | Latest |
| **Styling** | CSS3 | Modern features |

### Key Libraries
- **GLSLify**: Shader management
- **TWEAKPANE**: Debug panel UI

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd low-poly-waterfall

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
The dev server runs on `http://localhost:5173` by default with hot module replacement enabled.


### Optimization Tips
- Uses WebGL 2 for modern browser performance
- Lazy loading of resources
- Optimized shader rendering

## 🌐 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Import repository in Vercel
3. Vercel automatically detects Vite configuration
4. Deploy with one click!

```bash
# Build command: npm run build
# Output directory: dist
# Install command: npm install
```

### Environment Variables
Currently no environment variables required. All configuration is done via code.

## 🎯 Features in Detail



### Shader System
Custom GLSL shaders for:
- Grass rendering with displacement
- particle effects
- Water ripples and reflections
- Firefly glow effects
- Tree leaves and stems

## 🐛 Debug Features

Enable debug panel in browser console:
```javascript
window.debug = true;
```

## 📱 Browser Support

- **Chrome/Edge**: ✅ Full support (WebGL 2)
- **Firefox**: ✅ Full support (WebGL 2)
- **Safari**: ⚠️ WebGL 2 support (iOS 15+)
- **Mobile Chrome**: ✅ Full support with touch controls

## 🚀 Deployment

### Live Demo
- **Hosted on Vercel**: [low-poly-waterfall.vercel.app](https://low-poly-waterfall.vercel.app) *(Deploy URL)*
- Automatically deployed on git push to main branch

### Deploy Your Own

1. **Fork the Repository**
   ```bash
   git clone https://github.com/Debabrata-Giri-2001/low-poly-waterfall.git
   cd low-poly-waterfall
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

   Or connect your GitHub fork to Vercel for automatic deployments.

5. **Environment Variables** (if needed)
   - No API keys required
   - All resources are bundled locally

## 📝 License

This project is open source and available under the MIT License.

## 🎓 Learning Resources

Built with:
- [Three.js Documentation](https://threejs.org/docs/)
- [Rapier Physics Engine](https://rapier.rs/)
- [GSAP Animation Library](https://gsap.com/)
- [Vite Build Tool](https://vitejs.dev/)

## 📧 Contact & Support

For issues, feature requests, or suggestions, please create an issue on GitHub.

## 🙏 Acknowledgments

- Three.js community for incredible 3D rendering library
- Rapier Physics for robust physics simulation
- GSAP for smooth animations
- Inspired by open-world game "The Forest"

---

**Version**: 0.0.0  
**Last Updated**: June 2026  
**Status**: Production Ready ✅

Enjoy exploring the world with low-poly waterfalls🌳✨
