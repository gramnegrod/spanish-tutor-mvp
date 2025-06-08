# Complete Railway Documentation for Vanilla JavaScript Apps

Railway provides a modern platform for deploying vanilla JavaScript applications with excellent support for static sites and API integrations. This comprehensive guide covers everything you need to deploy HTML/CSS/JS apps with external API calls.

## Basic deployment steps for static sites

Railway offers two primary approaches for deploying vanilla JavaScript applications. The **NGINX template method** provides the quickest setup: create a new project, select the NGINX Static Site template, and Railway automatically configures everything. Your files should be organized in a `/site` directory containing your HTML, CSS, and JavaScript files. The platform detects changes and automatically rebuilds on each push.

For **custom deployments**, create a Dockerfile that copies your static files to NGINX and exposes port 80. Railway automatically assigns a PORT environment variable and provides HTTPS by default. The basic structure requires an index.html entry point, proper file paths relative to the root, and a simple Dockerfile for serving content.

**Essential deployment commands**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Initialize and deploy
railway login
railway init
railway up

# Link to existing project
railway link
```

## CORS configuration and handling

CORS issues frequently arise when Railway-hosted frontends communicate with backends on different domains. The browser blocks requests from `https://myapp-frontend.up.railway.app` to `https://myapi-backend.up.railway.app` without proper headers. Railway applications follow standard CORS behavior, requiring explicit configuration on your backend services.

**Backend CORS setup for Express.js**:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://myapp-frontend-production.up.railway.app',
    'https://mycustomdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
```

Common Railway-specific CORS pitfalls include HTTPS/HTTP mismatches (Railway uses HTTPS by default), app sleeping causing false CORS errors when the error page lacks headers, and case-sensitive domain matching. Always use exact Railway-generated domains and remove trailing slashes from origin URLs.

## Environment variables and API key security

**Critical security warning**: Environment variables in client-side JavaScript are **always exposed** to users. They become hardcoded in the bundled code and visible in browser developer tools. Never place private API keys, database URLs, or sensitive credentials in frontend environment variables.

Railway provides three types of variables: service-level (specific to one service), shared project-level (using `${{shared.VARIABLE_NAME}}` syntax), and sealed variables that remain hidden in the UI but available during builds. Access these through the Variables tab in your service settings.

For **client-side usage**, only use public or domain-restricted keys:
```javascript
// Safe for frontend - public keys only
const MAPS_PUBLIC_KEY = process.env.VITE_GOOGLE_MAPS_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLIC_KEY;
```

When you need private API keys, implement a **backend proxy pattern**. Create a separate Node.js service on Railway that handles API calls with private keys, then have your frontend call this proxy instead of external APIs directly.

## Custom domains and SSL configuration

Setting up custom domains involves navigating to your service's Settings tab, clicking "+ Custom Domain" under Public Networking, and adding the CNAME record Railway provides to your DNS provider. Railway automatically provisions Let's Encrypt SSL certificates for all custom domains.

For **Cloudflare users**, critical configuration is required: set SSL/TLS mode to "Full" (not "Full Strict"), disable the proxy during initial certificate issuance, and be aware that deeper subdomains like `*.sub.domain.com` require Cloudflare's Advanced Certificate Manager.

DNS configuration varies by provider. Standard subdomains use CNAME records pointing to your Railway app domain. Root domains require CNAME flattening or ALIAS records where supported. Some providers like GoDaddy have limitations with root domain configuration that may require workarounds.

## Build configuration examples

Railway supports both `railway.json` and `railway.toml` for build configuration. Here's a comprehensive `railway.json` for vanilla JavaScript apps:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build",
    "watchPatterns": [
      "src/**",
      "public/**",
      "package.json"
    ]
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

For **Vite projects**, configure the build process to handle Railway's dynamic port assignment:
```javascript
// vite.config.js
export default {
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000')
  }
}
```

## Static file serving best practices

Railway uses NGINX by default for excellent static file performance, handling 10,000+ simultaneous connections efficiently. Organize your files in a clear structure with `/site`, `/public`, or `/dist` as the root directory. Enable gzip compression and proper cache headers for optimal performance.

For **Single Page Applications**, configure fallback routing to handle client-side navigation:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/css application/javascript;
}
```

Performance optimization includes minifying CSS/JS files, optimizing images before deployment, using appropriate cache headers for static assets, and leveraging CDNs for larger files when beneficial.

## API proxy setup for hiding keys

When your frontend needs to access APIs with private keys, create a Node.js proxy service on Railway. This proxy handles the actual API calls while keeping keys secure on the server side.

**Complete proxy server example**:
```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// CORS for your frontend
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000']
}));

// Proxy endpoint
app.get('/api/weather', limiter, async (req, res) => {
  try {
    const response = await axios.get(process.env.WEATHER_API_URL, {
      params: {
        q: req.query.city,
        appid: process.env.WEATHER_API_KEY // Hidden from client
      }
    });
    
    res.json({
      city: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description
    });
  } catch (error) {
    res.status(500).json({ error: 'Weather service error' });
  }
});

app.listen(process.env.PORT || 3000);
```

Your frontend then calls this proxy instead of the external API directly, keeping API keys secure while avoiding CORS issues.

## CLI vs GitHub deployment methods

**Railway CLI** offers immediate deployment feedback and works from any directory without Git. It's ideal for CI/CD pipelines and quick deployments. Install with `npm install -g @railway/cli`, authenticate with `railway login`, and deploy with `railway up`. The CLI excels at local development integration but requires manual deployment commands.

**GitHub integration** provides automatic deployments on every push, PR preview environments, and build status checks in GitHub. After connecting your GitHub account in Railway settings, select your repository and Railway handles the rest. This method suits team workflows but requires a GitHub repository and offers less control over deployment timing.

Choose CLI for flexibility and local development, or GitHub integration for automated team workflows. Both methods support the same build configurations and deployment features.

## Monitoring and debugging

Railway provides comprehensive logging through three channels: the Build/Deploy panel for specific deployments, the Observability tab for cross-service logs, and the CLI command `railway logs`. Logs include build output, runtime application logs, and HTTP request data.

Advanced log filtering supports partial matches, exact phrases with quotes, replica-specific filtering, and log level filtering. Use structured JSON logging for better searchability. Log retention varies by plan: 7 days for Trial/Hobby, 30 days for Pro, and custom periods for Enterprise.

The **Observability dashboard** offers real-time metrics including CPU, memory, network, and disk usage. Create custom widgets to track specific metrics, monitor 30-day usage trends, and correlate logs across services. This integrated monitoring helps debug API call failures and performance issues effectively.

## Pricing considerations

Railway uses usage-based pricing ideal for static sites. The Hobby plan at $5/month includes $5 in usage credits, sufficient for most low-traffic static sites. Actual costs depend on CPU ($20/vCPU/month), memory ($10/GB/month), and network egress ($0.10/GB).

**Typical monthly costs**: Low-traffic sites under 1GB egress cost around $5-6/month. Medium-traffic sites with 10GB egress run $6-7/month. High-traffic sites using 100GB egress reach approximately $15/month. These costs remain competitive for sites that benefit from Railway's integrated platform features.

Static sites have minimal CPU and memory usage, with network egress being the primary cost driver. Implement proper caching headers and consider using Cloudflare's proxy for additional CDN benefits to minimize egress charges. Railway excels when you need databases or backend services alongside your static site, making it cost-effective for full-stack applications.

## Common pitfalls and solutions

**Port configuration**: Railway assigns ports dynamically. Never hardcode port numbers; always use `process.env.PORT`.

**File path issues**: Ensure all asset paths in HTML are relative to the served root directory, not your development structure.

**App sleeping**: Hobby plan apps sleep after inactivity. The first request may fail with timeout errors that appear as CORS issues.

**Build failures**: Common causes include missing Dockerfiles, incorrect file permissions, or files exceeding size limits.

**SSL certificate problems**: When using Cloudflare, incorrect SSL mode settings cause handshake failures. Always use "Full" mode, not "Full Strict".

**Environment variable exposure**: Remember that any variable accessible in client-side code is visible to users. Use backend proxies for sensitive data.

This comprehensive guide provides the technical foundation needed to successfully deploy vanilla JavaScript applications on Railway while maintaining security best practices and optimal performance.