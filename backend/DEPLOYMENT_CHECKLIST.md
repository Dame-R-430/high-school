# Deployment Checklist

Use this checklist to ensure your system is production-ready.

## Pre-Deployment

### Database Setup
- [ ] MongoDB installed (local) OR MongoDB Atlas account created
- [ ] Database connection string configured in `.env`
- [ ] Database seeded with initial data (`npm run seed`)
- [ ] Database connection tested successfully
- [ ] Indexes created (automatic with Mongoose)
- [ ] Backup strategy planned

### Security
- [ ] Strong JWT_SECRET set in `.env` (minimum 32 characters)
- [ ] MongoDB authentication enabled
- [ ] MongoDB network access restricted (not 0.0.0.0/0 in production)
- [ ] HTTPS/SSL certificate obtained
- [ ] CORS configured for production domain
- [ ] Password requirements enforced (minimum 6 characters)
- [ ] File upload size limits set
- [ ] Rate limiting implemented (optional but recommended)

### Code Quality
- [ ] All routes tested manually
- [ ] Error handling implemented
- [ ] Input validation in place
- [ ] No console.log in production code
- [ ] Environment variables used (no hardcoded secrets)
- [ ] Dependencies up to date (`npm audit`)

### Performance
- [ ] Database queries optimized
- [ ] Indexes verified
- [ ] Image compression for photos (optional)
- [ ] Response caching considered (optional)

## Deployment

### Server Setup
- [ ] Node.js installed (v14+)
- [ ] npm packages installed (`npm install`)
- [ ] Environment variables set
- [ ] Port configured (default 3000)
- [ ] Firewall rules configured
- [ ] Process manager installed (PM2 recommended)

### MongoDB Setup
- [ ] MongoDB accessible from server
- [ ] Connection string tested
- [ ] Database user created with appropriate permissions
- [ ] Backup schedule configured

### Web Server
- [ ] Nginx or Apache configured (optional)
- [ ] Reverse proxy setup (optional)
- [ ] SSL certificate installed
- [ ] Static files served efficiently

### Application
- [ ] Server starts without errors
- [ ] All routes accessible
- [ ] Authentication working
- [ ] File uploads working
- [ ] Section assignment working

## Post-Deployment

### Testing
- [ ] Admin login tested
- [ ] Teacher login tested
- [ ] Student registration tested
- [ ] Student approval tested
- [ ] Section assignment verified
- [ ] Subject management tested
- [ ] Grade submission tested (if implemented)
- [ ] All user roles tested

### Monitoring
- [ ] Server logs configured
- [ ] Error tracking setup
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications setup

### Documentation
- [ ] Admin user guide created
- [ ] Teacher user guide created
- [ ] Student registration guide created
- [ ] API documentation available
- [ ] Troubleshooting guide prepared

### Backup
- [ ] First backup completed
- [ ] Backup restoration tested
- [ ] Backup schedule verified
- [ ] Backup storage secured

## Production Checklist

### Environment Variables
```env
# Required
PORT=3000
JWT_SECRET=<strong-random-string-minimum-32-characters>
MONGODB_URI=<your-mongodb-connection-string>

# Optional
NODE_ENV=production
LOG_LEVEL=error
```

### MongoDB Atlas Production Settings
- [ ] Cluster tier appropriate for load (M10+ recommended)
- [ ] Replica set enabled (automatic on M10+)
- [ ] Automatic backups enabled
- [ ] Network access restricted to server IPs
- [ ] Database user has minimum required permissions
- [ ] Connection string uses SRV format
- [ ] SSL/TLS enabled (default)

### Server Configuration
```bash
# Install PM2 (process manager)
npm install -g pm2

# Start application
pm2 start server.js --name grade-system

# Configure auto-restart on reboot
pm2 startup
pm2 save

# Monitor application
pm2 monit
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Maintenance

### Daily
- [ ] Check server logs for errors
- [ ] Monitor database size
- [ ] Check backup completion

### Weekly
- [ ] Review user registrations
- [ ] Check system performance
- [ ] Update dependencies if needed
- [ ] Test backup restoration

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Database optimization
- [ ] User feedback review

## Scaling Checklist

### When to Scale

Scale when you experience:
- [ ] Response time > 1 second
- [ ] CPU usage > 80% consistently
- [ ] Memory usage > 80% consistently
- [ ] Database connections maxed out
- [ ] Frequent timeouts

### Vertical Scaling (Upgrade Server)
- [ ] Increase CPU cores
- [ ] Increase RAM
- [ ] Increase disk space
- [ ] Upgrade MongoDB tier

### Horizontal Scaling (Add Servers)
- [ ] Setup load balancer
- [ ] Deploy multiple app servers
- [ ] Configure session sharing
- [ ] Use MongoDB replica set
- [ ] Implement caching layer

## Troubleshooting

### Server Won't Start
```bash
# Check logs
pm2 logs grade-system

# Check port availability
netstat -an | grep 3000

# Check MongoDB connection
mongosh <your-connection-string>
```

### Database Connection Issues
```bash
# Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"

# Check network access (Atlas)
# - Verify IP whitelist
# - Check credentials
# - Test from server location
```

### Performance Issues
```bash
# Check server resources
top
df -h

# Check MongoDB performance
mongosh
db.currentOp()
db.serverStatus()

# Check slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

## Rollback Plan

If deployment fails:

1. **Stop new server**
   ```bash
   pm2 stop grade-system
   ```

2. **Restore database backup**
   ```bash
   mongorestore --uri="<connection-string>" ./backup
   ```

3. **Revert to previous version**
   ```bash
   git checkout <previous-commit>
   npm install
   pm2 restart grade-system
   ```

4. **Verify system working**
   - Test login
   - Test critical features
   - Check logs

## Support Contacts

- **MongoDB Support**: https://support.mongodb.com/
- **Node.js Issues**: https://github.com/nodejs/node/issues
- **Express Issues**: https://github.com/expressjs/express/issues

## Success Criteria

System is production-ready when:
- [ ] All checklist items completed
- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Response time < 500ms
- [ ] Uptime > 99%
- [ ] Backups working
- [ ] Monitoring active
- [ ] Documentation complete

## Final Sign-Off

- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] User acceptance testing completed
- [ ] Backup and recovery tested
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Training completed

**Deployment Date**: _______________
**Deployed By**: _______________
**Approved By**: _______________

---

**Note**: This checklist should be customized based on your specific requirements and infrastructure.
