import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, RefreshCw, Pencil, KeyRound, UserRound, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import {
  getUsers, createUser, updateUser, updateUserRole,
  updateUserStatus, resetUserPassword
} from "../services/userService";
import "./UtilisateursAcces.css";
import { useSearchParams } from "react-router-dom";

const ROLES = [
  { id: 1, label: "Employé" },
  { id: 2, label: "Éditeur" },
  { id: 3, label: "Administrateur" }
];
const ELEMENTS_PAR_PAGE = 5;
const EMPTY_FORM = { nom: "", prenom: "", username: "", email: "", id_role: "1" };

function UtilisateursAcces() {
  const { token, user: currentUser } = useAuth();
  // Lire les paramètres transmis depuis les actions rapides.
  const [searchParams, setSearchParams] = useSearchParams();
  // Le paramètre URL ouvre le formulaire sans effet ni setState.
  const demandeAjout = searchParams.get("action") === "ajouter";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  // Charger les utilisateurs avec le JWT administrateur.
  const chargerUtilisateurs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getUsers(token);
      setUsers(Array.isArray(result.users) ? result.users : []);
      setError("");
    } catch (err) {
      setError(err.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Éviter les mises à jour après le démontage.
    let active = true;
    async function load() {
      if (!token) return;
      try {
        const result = await getUsers(token);
        if (active) {
          setUsers(Array.isArray(result.users) ? result.users : []);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message || "Impossible de charger les utilisateurs.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [token]);

  const stats = useMemo(() => ({
    total: users.length,
    actifs: users.filter((u) => u.est_actif === true).length,
    inactifs: users.filter((u) => u.est_actif === false).length
  }), [users]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr");
    if (!term) return users;
    return users.filter((u) =>
      [u.nom, u.prenom, u.username, u.email, u.role]
        .some((value) => String(value ?? "").toLocaleLowerCase("fr").includes(term))
    );
  }, [users, query]);

  // Paginer les résultats après application de la recherche.
  const totalPages = Math.max(1, Math.ceil(filtered.length / ELEMENTS_PAR_PAGE));
  const pageActuelle = Math.min(Math.max(page, 1), totalPages);
  const debut = (pageActuelle - 1) * ELEMENTS_PAR_PAGE;
  const utilisateursAffiches = filtered.slice(debut, debut + ELEMENTS_PAR_PAGE);
  const premierElement = filtered.length === 0 ? 0 : debut + 1;
  const dernierElement = Math.min(debut + ELEMENTS_PAR_PAGE, filtered.length);

  function ouvrir(dialogType, account = null) {
    nettoyerActionURL();
    setSelected(account);
    setDialog(dialogType);
    setError("");
    setSuccess("");
    setTemporaryPassword(null);
    setForm(account ? {
      nom: account.nom || "", prenom: account.prenom || "",
      username: account.username || "", email: account.email || "",
      id_role: String(account.id_role)
    } : { ...EMPTY_FORM });
  }

  // La fenêtre demandée par l'URL est affichée directement au rendu.
  const dialogActif = dialog ?? (demandeAjout ? "create" : null);

  // Nettoyer l'URL lorsque la demande d'ajout a été traitée.
  function nettoyerActionURL() {
    if (!demandeAjout) return;
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.delete("action");
      return next;
    }, { replace: true });
  }

  function fermer() {
    if (busy) return;
    setDialog(null);
    nettoyerActionURL();
    setSelected(null);
    setTemporaryPassword(null);
  }

  // Exécuter une opération administrative et actualiser la liste.
  async function executer(operation, message) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await operation();
      // Ne jamais perdre le mot de passe temporaire si le rafraîchissement échoue.
      setSuccess(result.message || message);
      if (result.temporary_password) {
        setTemporaryPassword({ username: result.username, password: result.temporary_password });
        nettoyerActionURL();
        setDialog("password");
      } else {
        nettoyerActionURL();
        setDialog(null);
      }
      // Rafraîchir la liste indépendamment de la réussite de l’opération.
      try {
        await chargerUtilisateurs();
      } catch {
        // chargerUtilisateurs gère déjà les erreurs de chargement.
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  function soumettreFormulaire(event) {
    event.preventDefault();
    const payload = {
      nom: form.nom.trim(), prenom: form.prenom.trim(),
      username: form.username.trim(), email: form.email.trim()
    };
    if (dialogActif === "create") {
      executer(() => createUser(token, { ...payload, id_role: Number(form.id_role) }), "Utilisateur créé.");
    } else if (dialogActif === "edit" && selected) {
      executer(() => updateUser(token, selected.id_user, payload), "Utilisateur modifié.");
    }
  }

  function modifierRole(account, roleId) {
    if (Number(roleId) === account.id_role) return;
    if (!window.confirm(`Modifier le rôle de ${account.username} ?`)) return;
    executer(() => updateUserRole(token, account.id_user, Number(roleId)), "Rôle modifié.");
  }

  function modifierStatut(account) {
    const action = account.est_actif ? "désactiver" : "activer";
    if (!window.confirm(`Voulez-vous ${action} le compte ${account.username} ?`)) return;
    executer(() => updateUserStatus(token, account.id_user, !account.est_actif), "Statut modifié.");
  }

  function reinitialiser(account) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${account.username} ?`)) return;
    executer(() => resetUserPassword(token, account.id_user), "Mot de passe réinitialisé.");
  }

  return (
    <main className="users-page">
      <div className="users-heading">
        <div><p className="users-eyebrow">ADMINISTRATION · DOCUMIND</p><h1>Utilisateurs et accès</h1><p>Gérez les comptes et leurs rôles.</p></div>
        <button className="users-primary" onClick={() => ouvrir("create")}><Plus size={18}/> Ajouter un utilisateur</button>
      </div>

      {error && <div className="users-alert users-alert--error" role="alert">{error}</div>}
      {success && <div className="users-alert users-alert--success" role="status">{success}</div>}

      <div className="users-stats">
        <div><span>Total utilisateurs</span><strong>{stats.total}</strong></div>
        <div><span>Comptes actifs</span><strong>{stats.actifs}</strong></div>
        <div><span>Comptes inactifs</span><strong>{stats.inactifs}</strong></div>
      </div>

      <section className="users-panel">
        <div className="users-toolbar">
          <label className="users-search"><Search size={18}/><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Rechercher par nom, identifiant, email ou rôle" aria-label="Rechercher un utilisateur" /></label>
          <button className="users-secondary" onClick={chargerUtilisateurs} disabled={loading || busy}><RefreshCw size={17}/> Actualiser</button>
        </div>
        <div className="users-table-scroll"><table className="users-table"><thead><tr><th>Utilisateur</th><th>Identifiant</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead><tbody>
          {utilisateursAffiches.map((account) => (
            <tr key={account.id_user}>
              <td><div className="users-identity"><span className="users-avatar"><UserRound size={19}/></span><span><strong>{account.prenom} {account.nom}</strong><small>{account.email}</small></span></div></td>
              <td>{account.username}</td>
              <td><select aria-label={`Rôle de ${account.username}`} value={account.id_role} disabled={busy} onChange={(e) => modifierRole(account, e.target.value)}>{ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></td>
              <td><span className={`users-status ${account.est_actif ? "users-status--active" : "users-status--inactive"}`}>{account.est_actif ? "Actif" : "Inactif"}</span></td>
              <td><div className="users-actions"><button title="Modifier les informations" aria-label={`Modifier ${account.username}`} onClick={() => ouvrir("edit", account)} disabled={busy}><Pencil size={17}/></button><button title="Réinitialiser le mot de passe" aria-label={`Réinitialiser le mot de passe de ${account.username}`} onClick={() => reinitialiser(account)} disabled={busy || !account.est_actif || account.id_user === currentUser?.id_user}><KeyRound size={17}/></button><button className="users-status-button" onClick={() => modifierStatut(account)} disabled={busy || (account.id_user === currentUser?.id_user && account.est_actif)}>{account.est_actif ? "Désactiver" : "Activer"}</button></div></td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && <tr><td colSpan="5" className="users-empty">Aucun utilisateur trouvé.</td></tr>}
          {loading && <tr><td colSpan="5" className="users-empty">Chargement des utilisateurs...</td></tr>}
        </tbody></table></div>
        {/* Pagination : cinq utilisateurs au maximum par page. */}
        {!loading && !error && filtered.length > 0 && (
          <div className="users-pagination">
            <span className="users-pagination-info">
              Affichage de {premierElement} à {dernierElement} sur {filtered.length} utilisateur(s)
            </span>
            <div className="users-pagination-actions">
              <button type="button" disabled={pageActuelle <= 1}
                onClick={() => setPage(pageActuelle - 1)}>
                <ChevronLeft size={16} /> Précédent
              </button>
              <span>Page {pageActuelle} sur {totalPages}</span>
              <button type="button" disabled={pageActuelle >= totalPages}
                onClick={() => setPage(pageActuelle + 1)}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {(dialogActif === "create" || dialogActif === "edit") && <div className="users-modal-backdrop" role="presentation"><section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="users-modal-title"><div className="users-modal-header"><h2 id="users-modal-title">{dialogActif === "create" ? "Ajouter un utilisateur" : "Modifier un utilisateur"}</h2><button onClick={fermer} aria-label="Fermer"><X size={20}/></button></div><form onSubmit={soumettreFormulaire} className="users-form">
        {[{key:"nom",label:"Nom",min:2,max:100},{key:"prenom",label:"Prénom",min:2,max:100},{key:"username",label:"Nom d'utilisateur",min:3,max:50},{key:"email",label:"Adresse email",type:"email"}].map((field) => <label key={field.key}>{field.label}<input required type={field.type || "text"} minLength={field.min} maxLength={field.max} value={form[field.key]} onChange={(e) => setForm((prev) => ({...prev,[field.key]:e.target.value}))}/></label>)}
        {dialogActif === "create" && <label>Rôle<select value={form.id_role} onChange={(e) => setForm((prev) => ({...prev,id_role:e.target.value}))}>{ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>}
        <div className="users-modal-actions"><button type="button" className="users-secondary" onClick={fermer}>Annuler</button><button type="submit" className="users-primary" disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button></div>
      </form></section></div>}

      {dialogActif === "password" && temporaryPassword && <div className="users-modal-backdrop"><section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="users-password-title"><div className="users-modal-header"><h2 id="users-password-title">Mot de passe temporaire</h2><button onClick={fermer} aria-label="Fermer"><X size={20}/></button></div><p>Communiquez ce mot de passe à <strong>{temporaryPassword.username}</strong> par un canal sécurisé. Il ne sera plus affiché après fermeture.</p><div className="users-temporary-password">{temporaryPassword.password}</div><div className="users-modal-actions"><button className="users-secondary" onClick={() => navigator.clipboard.writeText(temporaryPassword.password)}>Copier</button><button className="users-primary" onClick={fermer}>J'ai enregistré le mot de passe</button></div></section></div>}
    </main>
  );
}

export default UtilisateursAcces;
