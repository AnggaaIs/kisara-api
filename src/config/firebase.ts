import * as admin from "firebase-admin";
import { environment } from "./environment";

class FirebaseAdmin {
  private static instance: admin.app.App;

  static initialize(): admin.app.App {
    if (!FirebaseAdmin.instance) {
      const serviceAccount = {
        type: "service_account",
        project_id: environment.firebase.projectId,
        private_key_id: environment.firebase.privateKeyId,
        private_key: environment.firebase.privateKey.replace(/\\n/g, "\n"),
        client_email: environment.firebase.clientEmail,
        client_id: environment.firebase.clientId,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: environment.firebase.clientCertUrl,
      };

      FirebaseAdmin.instance = admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
        projectId: environment.firebase.projectId,
      });
    }
    return FirebaseAdmin.instance;
  }

  static getMessaging(): admin.messaging.Messaging {
    return admin.messaging(this.getInstance());
  }

  static getInstance(): admin.app.App {
    if (!FirebaseAdmin.instance) {
      throw new Error("Firebase Admin not initialized");
    }
    return FirebaseAdmin.instance;
  }
}

export { FirebaseAdmin };
