import { useContext } from "react";
import { AuthContext } from "./AuthContextDefinition";

// Hook personnalisé permettant aux composants
// d'accéder aux informations d'authentification.
export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé dans AuthProvider"
    );
  }

  return context;
}
