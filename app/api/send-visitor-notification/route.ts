

import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { visitor, residentEmail } = await request.json()

    if (!visitor || !residentEmail) {
      return NextResponse.json({ error: "Missing visitor or residentEmail" }, { status: 400 })
    }

    // Create reusable transporter object using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER_EMAIL,
        pass: process.env.GMAIL_USER_PASSWORD, // Use app-specific password if 2FA enabled
      },
    })

    const mailOptions = {
      from: `"GateLog Notifications" <${process.env.GMAIL_USER_EMAIL}>`,
      to: residentEmail,
      subject: `New Visitor Approval Request from ${visitor.name}`,
      text: `
Hello,

You have a new visitor waiting for your approval.

Visitor Details:
Name: ${visitor.name}
Phone: ${visitor.phoneNumber}
Purpose: ${visitor.purpose}
Vehicle Number: ${visitor.vehicleNumber || "N/A"}
Timestamp: ${new Date(visitor.timestamp).toLocaleString()}

Please log in to your dashboard to approve or reject this visitor.

Thank you.
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: "Email sent successfully" })
  } catch (error: any) {
    console.error("Error sending visitor notification email:", error)
    if (error.response) {
      console.error("SendGrid response error:", error.response.body)
    }
    if (error.stack) {
      console.error("Stack trace:", error.stack)
    }
    return NextResponse.json({ error: "Failed to send email", details: error.message || error.toString() }, { status: 500 })
  }
}
