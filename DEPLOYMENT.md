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

## Notes

- Do not deploy source files directly; deploy the built `dist/` output.
- No provider-specific configuration is included in this repository.
