import "dotenv/config";
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@skipli.app";
const fromName = process.env.SENDGRID_FROM_NAME ?? "Skipli App";

async function run() {
  if (!apiKey) {
    console.error("No SENDGRID_API_KEY found!");
    return;
  }
  console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`From Email: ${fromEmail}`);
  sgMail.setApiKey(apiKey);

  const msg = {
    to: "thanhhung270502@gmail.com",
    from: {
      email: fromEmail,
      name: fromName,
    },
    subject: "Test directly via SendGrid",
    text: "Hello from test script!",
    html: "<strong>Hello from test script!</strong>",
  };

  try {
    const res = await sgMail.send(msg);
    console.log("SendGrid Response:", res);
  } catch (err: any) {
    console.error("Error sending directly:");
    if (err.response && err.response.body) {
      console.error(JSON.stringify(err.response.body, null, 2));
    } else {
      console.error(err);
    }
  }
}

run();
