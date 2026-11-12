
import { useAuth } from "../../contexts/useAuth";
import Logo from "../ui/Logo";
import "./DashboardLayout.css";

// Importation des icônes de Lucide React.
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
  DashboardLayout est la structure commune aux trois tableaux de bord.

  children : contenu spécifique au tableau de bord affiché.
  roleName : rôle de l'utilisateur connecté.

  Les menus sont adaptés au rôle pour éviter
  d'afficher les fonctionnalités non autorisées.
*/

function DashboardLayout({ children, roleName }) {

  // Récupérer les informations de l'utilisateur et la déconnexion.
  const { user, logout } = useAuth();

  // Construire les initiales de l'utilisateur connecté.
  const initials = (
    `${user?.prenom?.charAt(0) || ""}${user?.nom?.charAt(0) || ""}`
  ).toUpperCase();

  return (
    <div className="dashboard-layout">

      {/* =========================================
          MENU LATÉRAL
      ========================================= */}
      <aside className="dashboard-sidebar">

        {/* Logo officiel de DocuMind. */}
        <div className="sidebar-brand">
          <Logo />
        </div>

        {/* Navigation adaptée au rôle. */}
        <nav
          className="sidebar-navigation"
          aria-label="Navigation principale"
        >

          <p className="sidebar-section-title">
            ESPACE DE TRAVAIL
          </p>

          {/* Tableau de bord : accessible à tous. */}
          <div className="sidebar-menu-item active">
            <House size={21} strokeWidth={2} />
            <span>Tableau de bord</span>
          </div>

          {/* Recherche documentaire : accessible à tous. */}
          <div className="sidebar-menu-item">
            <Search size={21} strokeWidth={2} />
            <span>Recherche documentaire</span>
          </div>

          {/* Gestion documentaire : éditeur et administrateur. */}
          {roleName !== "Employé" && (
            <div className="sidebar-menu-item">
              <Layers size={21} strokeWidth={2} />
              <span>Documents et indexation</span>
            </div>
          )}

          {/* Gestion des utilisateurs : administrateur uniquement. */}
          {roleName === "Administrateur" && (
            <>
              <div className="sidebar-menu-item">
                <UsersRound size={21} strokeWidth={2} />
                <span>Utilisateurs et accès</span>
              </div>

              <div className="sidebar-menu-item">
                <ShieldCheck size={21} strokeWidth={2} />
                <span>Qualité et audit</span>
              </div>
            </>
          )}

        </nav>

        {/* =========================================
            PROFIL ET DÉCONNEXION
        ========================================= */}
        <div className="sidebar-footer">

          {/* Informations de l'utilisateur connecté. */}
          <div className="sidebar-user">

            <div className="sidebar-avatar">
              {initials}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {user?.prenom} {user?.nom}
              </strong>

              <p>{roleName}</p>
            </div>

          </div>

          {/* Conserver la fonction de déconnexion existante. */}
          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <LogOut size={19} strokeWidth={2} />
            <span>Se déconnecter</span>
          </button>

        </div>

      </aside>

      {/* =========================================
          PARTIE PRINCIPALE
      ========================================= */}
      <div className="dashboard-main">

        {/* En-tête commun aux trois tableaux de bord. */}
        <header className="dashboard-header">

          {/* Fil d'Ariane indiquant la page actuelle. */}
          <div className="header-navigation">

            <House
              size={22}
              strokeWidth={2}
              className="header-home-icon"
            />

            <span className="header-separator">|</span>

            <span className="header-breadcrumb">
              Espace de travail
            </span>

            <span className="header-slash">/</span>

            <strong className="header-current-page">
              Tableau de bord
            </strong>

          </div>

          {/* Notifications et avatar de l'utilisateur. */}
          <div className="header-actions">

            {/* Icône visuelle : notifications à développer plus tard. */}
            <span
              className="header-notification"
              title="Notifications (à venir)"
            >
              <Bell size={22} strokeWidth={2} />
            </span>

            <span className="header-divider" />

            {/* Avatar de l'utilisateur connecté. */}
            <div className="header-avatar">
              {user?.prenom?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Flèche décorative du futur menu de profil. */}
            <ChevronDown
              size={18}
              className="header-chevron"
            />

          </div>

        </header>

        {/* Contenu spécifique au rôle de l'utilisateur. */}
        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;
