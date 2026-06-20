# Production Deployment

## Backend
- FastAPI running on port 8000
- Docker container exposed on 8000

## Nginx
- Reverse proxy from HTTPS (443) to localhost:8000
- SSL managed by Let's Encrypt

## SSL Renewal
sudo certbot renew

## Reload Nginx
sudo systemctl reload nginx