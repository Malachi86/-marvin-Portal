
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineString } from "firebase-functions/params";

admin.initializeApp();

// Configuration for Gmail via Firebase Params
const emailUser = defineString("EMAIL_USER");
const emailPass = defineString("EMAIL_PASS");

// ----- DATA INTERFACES -----
interface PasswordResetData {
    usn: string;
    email: string;
}

interface GenericNotificationData {
    to: string | string[];
    subject: string;
    html: string;
}

// ----- GENERIC EMAIL SENDER -----
const sendEmailInternal = async (to: string | string[], subject: string, html: string) => {
  // Access values inside the function to ensure they are available at runtime
  const user = emailUser.value();
  const pass = emailPass.value();

  if (!user || !pass) {
    logger.error("EMAIL_USER or EMAIL_PASS not configured in Firebase environment.");
    throw new HttpsError("failed-precondition", "The server is not configured to send emails.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });

  const mailOptions = {
    from: `AMS:AMACC <${user}>`,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
    return { success: true, message: "Email transmitted successfully." };
  } catch (error: any) {
    logger.error("Nodemailer Error:", error);
    // Return a slightly more helpful message if it's an auth error (likely App Password issue)
    const errorMsg = error.message?.includes('Invalid login') 
      ? "Email authentication failed. Please check your Gmail App Password."
      : "An internal error occurred while sending the email.";
    throw new HttpsError("internal", errorMsg);
  }
};

// ----- CALLABLE FUNCTIONS -----

/**
 * Handles password recovery.
 * It looks up the user's current password in Firestore and sends it.
 */
export const sendPasswordReset = onCall(async (request) => {
    const { usn, email } = request.data as PasswordResetData;
    
    if (!usn || !email) {
        throw new HttpsError("invalid-argument", "USN and email are required.");
    }

    try {
        const usersRef = admin.firestore().collection('users');
        // USN is the document ID in your system
        const userDoc = await usersRef.doc(usn).get();

        if (!userDoc.exists) {
            throw new HttpsError("not-found", "No account found with that USN.");
        }

        const userData = userDoc.data();
        if (userData?.email !== email) {
            throw new HttpsError("permission-denied", "The provided email does not match our records.");
        }

        const subject = '🔐 PASSWORD RETRIEVAL - AMS';
        const html = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #6D1B0A;">Account Security Protocol</h2>
            <p>Hello <b>${userData.name}</b>,</p>
            <p>You requested to retrieve your password for the AMS Student Portal.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; font-size: 18px; text-align: center; border: 1px dashed #6D1B0A; margin: 20px 0;">
              Your Access Key is: <br/>
              <span style="font-family: monospace; font-weight: bold; font-size: 24px; color: #D1432A;">${userData.password}</span>
            </div>
            <p style="font-size: 12px; color: #888;">If you did not request this, please secure your account immediately.</p>
          </div>
        `;
        return await sendEmailInternal(email, subject, html);
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        logger.error("Firestore lookup error:", error);
        throw new HttpsError("internal", "Failed to retrieve account data.");
    }
});

/**
 * Unified notification endpoint used by the client for various alerts.
 */
export const sendNotificationEmail = onCall(async (request) => {
    const { to, subject, html } = request.data as GenericNotificationData;
    
    if (!to || !subject || !html) {
        throw new HttpsError("invalid-argument", "Missing required email fields (to, subject, html).");
    }

    return await sendEmailInternal(to, subject, html);
});
