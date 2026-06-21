import "dotenv/config";
import { initializeFirebase, getDb } from "../common/services/firebase";
import { createAccessCode } from "../modules/owner-auth/owner-auth.service";

async function run() {
  const phoneNumber = process.argv[2];
  if (!phoneNumber) {
    console.error(
      "❌ Please provide a phone number as an argument, e.g.:\n   npx ts-node src/test.sms.ts +84987654321"
    );
    process.exit(1);
  }

  console.log(`🚀 Initializing Firebase Admin...`);
  const db = initializeFirebase();

  if (!db) {
    console.error("❌ Failed to initialize Firebase database.");
    process.exit(1);
  }

  const ownerRef = db.collection("owners").doc(phoneNumber);
  const ownerDoc = await ownerRef.get();

  if (!ownerDoc.exists) {
    console.log(`⚠️ Owner with phone number ${phoneNumber} is not registered.`);
    console.log(
      `📝 Registering phone number ${phoneNumber} as an owner in Firestore...`
    );
    await ownerRef.set({
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Pre-registered owner successfully.`);
  } else {
    console.log(
      `✅ Owner with phone number ${phoneNumber} is already registered.`
    );
  }

  console.log(`✉️ Generating and sending OTP SMS to ${phoneNumber}...`);
  try {
    const otp = await createAccessCode(phoneNumber);
    console.log("\n==============================================");
    console.log(`🎉 OTP code successfully generated: ${otp}`);
    console.log(`📱 SMS has been sent via Twilio!`);
    console.log("==============================================\n");

    console.log("💡 To validate this access code, you can call the API.");
    console.log("To validate using curl, run:");
    console.log(
      `curl -X POST http://localhost:5000/api/owner/validate-access-code \\`
    );
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(
      `  -d '{"phoneNumber": "${phoneNumber}", "accessCode": "${otp}"}'`
    );
  } catch (error: any) {
    console.error("❌ Error running OTP flow:", error.message || error);
  } finally {
    // Terminate firebase connection process cleanly
    process.exit(0);
  }
}

run();
