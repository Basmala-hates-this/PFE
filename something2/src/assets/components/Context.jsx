// context/RegistrationContext.jsx
import { createContext, useContext, useState } from "react";

const RegistrationContext = createContext();

export function RegistrationProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [credentials, setCredentials] = useState(null);

  return (
    <RegistrationContext.Provider
      value={{ profile, setProfile, credentials, setCredentials }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  return useContext(RegistrationContext);
}
