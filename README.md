# GateLog Visitor Management System

![GateLog Blue Logo](https://raw.githubusercontent.com/Aryangaikwadsql/GateLog-Visitor-Management-System/master/public/logoinblue.png)

## Overview
GateLog is a visitor management system designed to streamline and secure visitor access to residential or commercial properties. It provides features such as visitor registration, approval workflows, real-time visitor tracking, and reporting.

## Features
- Visitor registration and approval by committee members
- Real-time visitor status updates (pending, approved, rejected)
- Visitor data visualization with heatmaps
- PDF export of visitor lists
- User authentication and role-based access control
- Responsive UI with accessibility considerations
- Legal and informational pages: Terms of Service, Privacy Policy, About Us, Contact Support
- Footer component included in all pages for consistent navigation and information

## Prerequisites
- Node.js (version 16 or higher recommended)
- npm or pnpm package manager
- Firebase account and project setup

## Installation
1. Clone the repository
2. Install dependencies using `npm install` or `pnpm install`
3. Configure Firebase services as per `app/firebase-provider.tsx`
4. Run the development server with `npm run dev` or `pnpm dev`

## Environment Variables Setup
- Create a `.env.local` file in the root directory
- Add your Firebase configuration keys and any other required environment variables
- Example:
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
  ```

## Usage
- Access the app via the provided URL (usually http://localhost:3000)
- Sign in as a committee member or resident
- Manage visitor registrations and approvals
- Export visitor data as needed

## Testing
- Currently, no automated tests are included
- Manual testing is recommended for key workflows such as visitor registration, approval, and data export

## Deployment
- The app can be deployed to platforms like Vercel or Firebase Hosting
- Ensure environment variables are configured in the deployment environment

## Known Issues or Limitations
- No offline support currently
- Limited role management beyond committee members and residents
- No multi-language support

## Legal
- Terms of Service, Privacy Policy, and other legal pages are included in the app under `/terms-of-service`, `/privacy-policy`, etc.
- The project is licensed under the MIT License. See the LICENSE file for details.

## Contributing
Contributions are welcome. Please fork the repository and submit pull requests.

## Contact Support
For support or inquiries, please visit the Contact Support page or email: testgatelog@gmail.com

## Acknowledgments
- Built with Next.js, React, Firebase, Tailwind CSS, and other modern web technologies.
- Icons by Lucide React.
- PDF generation using jsPDF.
