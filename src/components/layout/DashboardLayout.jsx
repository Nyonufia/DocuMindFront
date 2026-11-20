
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import Logo from "../ui/Logo";
import "./DashboardLayout.css";

// Importation des icônes Lucide React.
import {
  House,
  Search,
  Layers,
  UsersRound,
  ShieldCheck,
  LogOut,
  Bell,
  ChevronDown
} from "lucide-react";

/*
  DashboardLayout est la structure commune
  aux interfaces de DocuMind.

  children : contenu de la page affichée.
  roleName : rôle de l'utilisateur connecté.

  Fonctionnalités :
  - Navigation React Router
  - Menu adapté aux rôles
  - Indication de la page active
  - Fil d'Ariane dynamique
  - Informations du compte
  - Déconnexion
*/

// Définir les pages et leurs titres.
const titresPages = {
  "/dashboard": "Tableau de bord",
  "/recherche": "Recherche documentaire",
  "/documents": "Documents et indexation",
  "/utilisateurs": "Utilisateurs et accès",
  "/qualite": "Qualité et audit"
};

// Définir les menus disponibles selon les rôles.
const menus = [
  {
    label: "Tableau de bord",
    chemin: "/dashboard",
    icone: House,
    roles: [1, 2, 3]
  },
  {
    label: "Recherche documentaire",
    chemin: "/recherche",
    icone: Search,
    roles: [1, 2, 3]
  },
  {
    label: "Documents et indexation",
    chemin: "/documents",
    icone: Layers,
    roles: [1, 2, 3]
  },
  {
    label: "Utilisateurs et accès",
    chemin: "/utilisateurs",
    icone: UsersRound,
    roles: [3]
  },
  {
    label: "Qualité et audit",
    chemin: "/qualite",
    icone: ShieldCheck,
    roles: [3]
  }
];

function DashboardLayout({ children, roleName }) {

  // Récupérer l'utilisateur et la déconnexion.
  const { user, logout } = useAuth();

  // Récupérer le chemin de la page actuelle.
  const location = useLocation();

  // Identifier le rôle depuis le compte authentifié.
  const idRole = user?.id_role;

  // Adapter le titre de la page documentaire selon le rôle.
const titreActuel =
  location.pathname === "/documents" && idRole === 1
    ? "Mes documents"
    : titresPages[location.pathname] || "Espace de travail";

  // Construire les initiales du compte.
  const initials = (
    `${user?.prenom?.charAt(0) || ""}${user?.nom?.charAt(0) || ""}`
  ).toUpperCase() || "U";

  // Déterminer le nom du rôle.
  const nomsRoles = {
    1: "Employé",
    2: "Éditeur",
    3: "Administrateur"
  };

  const roleAffiche =
    roleName || nomsRoles[idRole] || "Utilisateur";

  // Conserver uniquement les menus autorisés.
  const menusAutorises = menus.filter(
    (menu) => menu.roles.includes(idRole)
  );

  return (
    <div className="dashboard-layout">

      {/* =========================================
          BARRE LATÉRALE
      ========================================= */}
      <aside className="dashboard-sidebar">

        {/* Logo de DocuMind. */}
        <div className="sidebar-brand">
          <Logo />
        </div>

        {/* =========================================
            NAVIGATION PRINCIPALE
        ========================================= */}
        <nav
          className="sidebar-navigation"
          aria-label="Navigation principale"
        >

          <p className="sidebar-section-title">
            ESPACE DE TRAVAIL
          </p>

          {/* Afficher les menus selon le rôle. */}
          {menusAutorises.map((menu) => {

            const Icone = menu.icone;

            return (
              <NavLink
                key={menu.chemin}
                to={menu.chemin}
                end
                className={({ isActive }) =>
                  `sidebar-menu-item ${isActive ? "active" : ""
                  }`
                }
              >
                <Icone
                  size={21}
                  strokeWidth={2}
                />

                <span>
                  {menu.chemin === "/documents" && idRole === 1
                    ? "Mes documents"
                    : menu.label}
                </span>
              </NavLink>
            );
          })}

        </nav>

        {/* =========================================
            PROFIL UTILISATEUR
        ========================================= */}
        <div className="sidebar-footer">

          {/* Informations du compte connecté. */}
          <div className="sidebar-user">

            <div className="sidebar-avatar">
              {initials}
            </div>

            <div className="sidebar-user-info">

              <strong>
                {user?.prenom} {user?.nom}
              </strong>

              <p>
                {roleAffiche}
              </p>

            </div>

          </div>

          {/* =========================================
              DÉCONNEXION
          ========================================= */}
          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <LogOut
              size={19}
              strokeWidth={2}
            />

            <span>
              Se déconnecter
            </span>
          </button>

        </div>

      </aside>

      {/* =========================================
          CONTENU PRINCIPAL
      ========================================= */}
      <div className="dashboard-main">

        {/* =========================================
            EN-TÊTE
        ========================================= */}
        <header className="dashboard-header">

          {/* Fil d'Ariane dynamique. */}
          <div className="header-navigation">

            <NavLink
              to="/dashboard"
              className="header-home-link"
              aria-label="Retour au tableau de bord"
            >
              <House
                size={22}
                strokeWidth={2}
                className="header-home-icon"
              />
            </NavLink>

            <span className="header-separator">
              |
            </span>

            <span className="header-breadcrumb">
              Espace de travail
            </span>

            <span className="header-slash">
              /
            </span>

            <strong className="header-current-page">
              {titreActuel}
            </strong>

          </div>

          {/* =========================================
              ACTIONS DE L'EN-TÊTE
          ========================================= */}
          <div className="header-actions">

            {/* Notifications à développer plus tard. */}
            <span
              className="header-notification"
              title="Notifications (à venir)"
            >
              <Bell
                size={22}
                strokeWidth={2}
              />
            </span>

            <span className="header-divider" />

            {/* Avatar de l'utilisateur connecté. */}
            <div
              className="header-avatar"
              title={`${user?.prenom || ""} ${user?.nom || ""}`}
            >
              {user?.prenom?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Futur menu de profil. */}
            <ChevronDown
              size={18}
              className="header-chevron"
            />

          </div>

        </header>

        {/* =========================================
            CONTENU DE LA PAGE ACTIVE
        ========================================= */}
        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;
