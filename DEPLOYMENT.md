# Deployment

This project is designed for static hosting.

## Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run type checking:

   ```bash
   npm run typecheck
   ```

3. Run tests:

   ```bash
   npm run test:run
   ```

4. Build the app:

   ```bash
   npm run build
   ```

5. Deploy the generated `dist/` directory to your static hosting provider.

6. Configure the custom domain `24game.davelhw.com` in the hosting provider's domain settings.

7. Add the DNS record required by your provider, usually a `CNAME` or `A` record.

8. Verify HTTPS is enabled and the site loads correctly on the custom domain.

9. Set `VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN` in the production environment to enable Cloudflare Web Analytics.

## Notes

- Do not deploy source files directly; deploy the built `dist/` output.
- The analytics beacon is not injected when `VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN` is missing.
- No provider-specific configuration is included in this repository.
