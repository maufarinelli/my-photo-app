import React from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";

import awsExports from "../../../aws-exports";
Amplify.configure(awsExports);

const MyAuthenticator: React.FC = () => {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <main>
          {user ? (
            <>
              <h1>My Photos App</h1>
              <h2>Hello {user.username}</h2>
              <button onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <h1>My Photos App</h1>
              <p>Login</p>
            </>
          )}
        </main>
      )}
    </Authenticator>
  );
};

export default MyAuthenticator;
