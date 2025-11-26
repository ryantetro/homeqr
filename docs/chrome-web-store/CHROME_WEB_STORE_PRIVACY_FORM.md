# Chrome Web Store Privacy & Permissions Form

## Single Purpose Description (1000 characters max)

```
HomeQR generates QR codes for property listings directly from MLS websites (Zillow, Realtor.com, etc.). The extension extracts property details from listing pages and creates QR codes that link to branded property microsites where real estate agents can capture buyer leads and track marketing performance.
```

## Permission Justifications

### activeTab Justification (1000 characters max)

```
The activeTab permission is required to extract property listing data (address, price, photos, features) from MLS websites when the user clicks the extension icon. This permission allows the extension to access the current tab's content only when the user actively invokes the extension, ensuring minimal data access. The extension extracts property information to automatically populate listing details, eliminating the need for manual data entry when generating QR codes.
```

### storage Justification (1000 characters max)

```
The storage permission is used to securely store the user's authentication token after they sign in to their HomeQR account. This token is necessary to authenticate API requests when generating QR codes and creating listings. The token is stored locally in the browser and is only sent to the HomeQR application server (home-qrcode.com) to verify the user's identity. No third-party services have access to this stored data.
```

### scripting Justification (1000 characters max)

```
The scripting permission is required to inject content scripts that extract property listing data from MLS websites. The extension uses content scripts to parse property information (address, price, bedrooms, bathrooms, photos, etc.) from the page DOM and JSON-LD structured data. This data extraction happens only when the user actively clicks the extension icon on a listing page, and the extracted data is used solely to populate the QR code generation form.
```

### tabs Justification (1000 characters max)

```
The tabs permission is used to check the current tab's URL to determine if the user is on a supported MLS website (Zillow, Realtor.com, etc.) and to detect when the user is on the HomeQR dashboard page. When on the dashboard, the extension automatically retrieves an authentication token to enable QR code generation. The extension only accesses tab URLs, not tab content, and only when the user interacts with the extension.
```

### Host Permission Justification (1000 characters max)

```
Host permissions are required for two purposes:

1. **MLS Websites** (zillow.com, realtor.com, redfin.com, trulia.com, homes.com, mls.com, sondergrouputah.com): The extension needs access to these domains to extract property listing data when users visit property pages. The extension reads publicly available property information (address, price, photos, features) from these pages to automatically populate listing details for QR code generation.

2. **HomeQR Application** (home-qrcode.com, localhost:3000 for development): The extension communicates with the HomeQR web application to authenticate users, create listings, and generate QR codes. All communication is encrypted via HTTPS and requires user authentication.

The extension only accesses these sites when the user actively clicks the extension icon, and all data is used solely for the purpose of generating QR codes for the user's property listings.
```

## Remote Code

**Answer: No, I am not using Remote code**

(If you need to justify, use this:)
```
The extension does not load or execute any JavaScript or WebAssembly code from remote sources. All code is bundled within the extension package. The extension only makes API calls to the HomeQR application server (home-qrcode.com) for data transmission (creating listings, generating QR codes), but does not execute any code received from these API responses.
```

## Data Usage

### What user data do you plan to collect?

**Check the following boxes:**

✅ **Personally identifiable information**
- Name, email address, phone number (collected from lead forms when buyers submit contact information on property microsites)
- User profile information (name, email, phone, brokerage) for account management

✅ **Authentication information**
- User credentials (email/password) for account login
- Authentication tokens stored locally in browser storage

✅ **Location**
- IP address and region (collected for analytics to show geographic distribution of property views)
- Used to determine visitor location for analytics dashboard

✅ **User activity**
- QR code scans (tracked when users scan QR codes)
- Page views (tracked when visitors view property microsites)
- Click events on property microsites (for analytics)
- Extension usage (when extension icon is clicked, when QR codes are generated)

✅ **Website content**
- Property listing data extracted from MLS websites (address, price, photos, features, description)
- This data is extracted from publicly available listing pages and used to create QR codes

**Do NOT check:**
- ❌ Health information
- ❌ Financial and payment information (handled by Stripe, not the extension)
- ❌ Personal communications
- ❌ Web history

### Certifications

✅ **I do not sell or transfer user data to third parties, outside of the approved use cases**
- User data is only stored in the HomeQR application database
- Payment processing is handled by Stripe (approved use case)
- No data is sold to third parties

✅ **I do not use or transfer user data for purposes that are unrelated to my item's single purpose**
- All collected data is used solely for QR code generation, lead capture, and analytics related to property listings
- Data is not used for advertising, marketing to third parties, or any unrelated purposes

✅ **I do not use or transfer user data to determine creditworthiness or for lending purposes**
- HomeQR does not perform credit checks or provide lending services
- User data is not used for financial assessment

## Privacy Policy URL

```
https://www.home-qrcode.com/privacy
```

**Note:** You need to create a privacy policy page at this URL. The privacy policy should include:

1. What data is collected
2. How data is used
3. How data is stored and secured
4. User rights (access, deletion, etc.)
5. Third-party services (Stripe for payments)
6. Cookies and tracking
7. Contact information for privacy inquiries

## Additional Notes

- The extension only accesses data when the user actively clicks the extension icon
- All API communications are encrypted via HTTPS
- User authentication tokens are stored securely in browser storage
- Property data extraction only reads publicly available information from MLS websites
- No data is shared with MLS websites or other third parties except for payment processing (Stripe)

