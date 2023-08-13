"use client"
import { Amplify } from "aws-amplify";
import awsExports from "../aws-exports";

import "@aws-amplify/ui-react/styles.css";

Amplify.configure({ ...awsExports, ssr: true });

import { Authenticator } from "@aws-amplify/ui-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <h1>Hello, {user?.username}!</h1>
            <button onClick={signOut}>Sign out</button>
          </main>
        )}
      </Authenticator>
    </main>
  );
}
