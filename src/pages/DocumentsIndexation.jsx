
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    FileText,
    Upload,
    Search,
    Eye,
    Download,
    Trash2,
    RefreshCw,
    Layers,
    FilePlus2,
    X,
    AlertCircle,
    CheckCircle2,
    Clock3,
    FolderPlus,
    Folders,
    Pencil,
    Power
} from "lucide-react";

import { useAuth } from "../contexts/useAuth";

import {
    listerDocuments,
    importerDocument,
    indexerDocument,
    supprimerDocument,
    ajouterVersion,
    obtenirDocument
} from "../services/documentService";

import {
    listerCollections,
    creerCollection,
    modifierCollection,
    changerStatutCollection
} from "../services/collectionService";
import { obtenirInformationsDocument } from "../services/rechercheService";
import DocumentViewer from "../components/documents/DocumentViewer";

import "../styles/DocumentsIndexation.css";

/*
  Page de gestion documentaire DocuMind.

  Les administrateurs et éditeurs peuvent :
  - Consulter les documents autorisés
  - Importer et indexer des fichiers
  - Ajouter une nouvelle version
  - Télécharger ou prévisualiser un document
  - Effectuer une suppression logique
*/

const FORMATS = [".pdf", ".docx", ".txt"];
const TAILLE_MAX = 20 * 1024 * 1024;

// Convertir les octets en une taille lisible.
function formaterTaille(octets) {
    if (octets == null) return "—";
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) {
        return `${(octets / 1024).toFixed(1)} Ko`;
    }
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

// Uniformiser les différents statuts d'indexation.
function statutDocument(document) {
    return String(
        document.derniere_version?.statut ??
        document.statut ??
        document.statut_indexation ??
        "inconnu"
    ).toLowerCase();
}

// Vérifier les fichiers avant leur envoi.
function validerFichier(fichier) {
    if (!fichier) return "Sélectionne un fichier.";

    const nom = fichier.name.toLowerCase();

    if (!FORMATS.some((extension) => nom.endsWith(extension))) {
        return "Formats autorisés : PDF, DOCX et TXT.";
    }

    if (fichier.size > TAILLE_MAX) {
        return "La taille maximale est de 20 Mo.";
    }

    if (fichier.size === 0) {
        return "Le fichier est vide.";
    }

    return "";
}

function DocumentsIndexation() {
    const { token } = useAuth();

    const [documents, setDocuments] = useState([]);
    const [collections, setCollections] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [operation, setOperation] = useState("");
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");

    const [recherche, setRecherche] = useState("");
    const [filtreCollection, setFiltreCollection] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("");

    const [modalImport, setModalImport] = useState(false);
    const [fichierImport, setFichierImport] = useState(null);
    const [collectionImport, setCollectionImport] = useState("");

    const [versionDocument, setVersionDocument] = useState(null);
    const [fichierVersion, setFichierVersion] = useState(null);

    const [documentOuvert, setDocumentOuvert] = useState(null);

    // Gestion des fenêtres de collections.
    const [modalNouvelleCollection, setModalNouvelleCollection] =
        useState(false);

    const [modalGestionCollections, setModalGestionCollections] =
        useState(false);

    // Collection sélectionnée pour modification.
    const [collectionEdition, setCollectionEdition] =
        useState(null);

    // Informations du formulaire de collection.
    const [formCollection, setFormCollection] = useState({
        collection_name: "",
        description: "",
        niveau_acces: "Interne"
    });

    // Préparer le formulaire pour une nouvelle collection ou une modification.
    function ouvrirFormulaireCollection(collection = null) {
        setErreur("");
        setMessage("");
        setCollectionEdition(collection);
        setFormCollection({
            collection_name: collection?.collection_name ?? "",
            description: collection?.description ?? "",
            niveau_acces: collection?.niveau_acces ?? "Interne"
        });
        setModalGestionCollections(false);
        setModalNouvelleCollection(true);
    }

    // Fermer le formulaire et revenir à la gestion en cas de modification.
    function fermerFormulaireCollection() {
        setModalNouvelleCollection(false);
        if (collectionEdition) setModalGestionCollections(true);
        setCollectionEdition(null);
        setErreur("");
    }

    // Récupérer les documents et les collections en parallèle.
    const chargerDonnees = useCallback(async () => {
        if (!token) return;

        const [listeDocuments, listeCollections] = await Promise.all([
            chargerDocumentsComplets(token),
            listerCollections(token)
        ]);

        // Accepter une liste directe ou un objet contenant la liste.
        setDocuments(
            Array.isArray(listeDocuments)
                ? listeDocuments
                : listeDocuments?.documents ?? []
        );

        setCollections(
            Array.isArray(listeCollections)
                ? listeCollections
                : []
        );
    }, [token]);

    // Charger les données à l'ouverture de la page.
    useEffect(() => {
        if (!token) return;

        let actif = true;

        async function initialiser() {
            try {
                const [listeDocuments, listeCollections] =
                    await Promise.all([
                        chargerDocumentsComplets(token),
                        listerCollections(token)
                    ]);

                if (!actif) return;

                setDocuments(
                    Array.isArray(listeDocuments)
                        ? listeDocuments
                        : listeDocuments?.documents ?? []
                );

                setCollections(
                    Array.isArray(listeCollections)
                        ? listeCollections
                        : []
                );
            } catch (err) {
                if (actif) setErreur(err.message);
            } finally {
                if (actif) setChargement(false);
            }
        }

        initialiser();

        return () => {
            actif = false;
        };
    }, [token]);

    // Préparer les noms des collections.
    const nomsCollections = useMemo(() => {
        return Object.fromEntries(
            collections.map((collection) => [
                collection.id_collection,
                collection.collection_name
            ])
        );
    }, [collections]);

    // Filtrer les documents visibles.
    const documentsFiltres = useMemo(() => {
        return documents.filter((document) => {
            const titre = String(document.titre ?? "").toLowerCase();
            const correspondRecherche = titre.includes(
                recherche.trim().toLowerCase()
            );

            const correspondCollection =
                !filtreCollection ||
                String(document.id_collection) === filtreCollection;

            const correspondStatut =
                !filtreStatut ||
                statutDocument(document) === filtreStatut;

            return (
                correspondRecherche &&
                correspondCollection &&
                correspondStatut
            );
        });
    }, [documents, recherche, filtreCollection, filtreStatut]);

    // Statistiques calculées depuis les documents accessibles.
    const statistiques = useMemo(() => ({
        total: documents.length,
        indexes: documents.filter(
            (document) => statutDocument(document) === "indexed"
        ).length,
        attente: documents.filter(
            (document) => statutDocument(document) === "pending"
        ).length,
        erreurs: documents.filter(
            (document) =>
                ["error", "failed", "erreur"].includes(
                    statutDocument(document)
                )
        ).length
    }), [documents]);

    // Exécuter une opération et actualiser les données.
    async function executerOperation(cle, action, succes) {
        setOperation(cle);
        setErreur("");
        setMessage("");

        try {
            await action();
            await chargerDonnees();
            setMessage(succes);
            return true;
        } catch (err) {
            setErreur(err.message);
            return false;
        } finally {
            setOperation("");
        }
    }

    // Enregistrer une nouvelle collection ou les modifications apportées.
    async function enregistrerCollection(event) {
        event.preventDefault();
        const nom = formCollection.collection_name.trim();
        const description = formCollection.description.trim();

        if (nom.length < 2 || nom.length > 150) {
            setErreur("Le nom doit contenir entre 2 et 150 caractères.");
            return;
        }
        if (description.length > 500) {
            setErreur("La description ne doit pas dépasser 500 caractères.");
            return;
        }

        const donnees = {
            collection_name: nom,
            description: description || null,
            niveau_acces: formCollection.niveau_acces
        };
        const edition = Boolean(collectionEdition);
        const reussi = await executerOperation(
            "collection-save",
            () => edition
                ? modifierCollection(token, collectionEdition.id_collection, donnees)
                : creerCollection(token, donnees),
            edition ? "Collection modifiée avec succès." : "Collection créée avec succès."
        );
        if (reussi) {
            setModalNouvelleCollection(false);
            setCollectionEdition(null);
            if (edition) setModalGestionCollections(true);
        }
    }

    // Activer ou désactiver une collection via l'API.
    async function basculerStatutCollection(collection) {
        const nouveauStatut = !collection.est_active;
        await executerOperation(
            `collection-status-${collection.id_collection}`,
            () => changerStatutCollection(token, collection.id_collection, nouveauStatut),
            nouveauStatut ? "Collection activée." : "Collection désactivée."
        );
    }

    // Importer un nouveau fichier.
    async function soumettreImport(event) {
        event.preventDefault();

        const erreurFichier = validerFichier(fichierImport);

        if (erreurFichier) {
            setErreur(erreurFichier);
            return;
        }

        if (!collectionImport) {
            setErreur("Sélectionne une collection.");
            return;
        }

        const reussi = await executerOperation(
            "import",
            () => importerDocument(
                token,
                fichierImport,
                Number(collectionImport)
            ),
            "Document importé. Il peut maintenant être indexé."
        );

        if (reussi) {
            setModalImport(false);
            setFichierImport(null);
            setCollectionImport("");
        }
    }

    // Lancer l'indexation du document sélectionné.
    async function lancerIndexation(document) {
        await executerOperation(
            `index-${document.id_document ?? document.id_doc}`,
            () => indexerDocument(token, document.id_document ?? document.id_doc),
            "Indexation terminée. Le statut a été actualisé."
        );
    }

    // Ouvrir le lecteur documentaire existant.
    async function consulter(document) {
        setOperation(`view-${document.id_document ?? document.id_doc}`);
        setErreur("");

        try {
            const informations = await obtenirInformationsDocument(
                token,
                document.id_document ?? document.id_doc
            );

            setDocumentOuvert({
                ...document,
                ...informations,
                id_doc: document.id_document ?? document.id_doc
            });
        } catch (err) {
            setErreur(err.message);
        } finally {
            setOperation("");
        }
    }

    // Télécharger le fichier original avec le JWT.
    async function telecharger(document) {
        setOperation(`download-${document.id_document ?? document.id_doc}`);
        setErreur("");

        try {
            const response = await fetch(
                `http://localhost:8000/documents/${document.id_document ?? document.id_doc}/telecharger`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || "Téléchargement impossible.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const lien = window.document.createElement("a");

            lien.href = url;
            lien.download = document.titre || `document-${document.id_document ?? document.id_doc}`;
            window.document.body.appendChild(lien);
            lien.click();
            lien.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            setErreur(err.message);
        } finally {
            setOperation("");
        }
    }

    // Effectuer une suppression logique après confirmation.
    async function supprimer(document) {
        const confirme = window.confirm(
            `Supprimer le document « ${document.titre} » ?`
        );

        if (!confirme) return;

        await executerOperation(
            `delete-${document.id_document ?? document.id_doc}`,
            () => supprimerDocument(token, document.id_document ?? document.id_doc),
            "Document supprimé avec succès."
        );
    }

    // Ajouter une nouvelle version du document.
    async function soumettreVersion(event) {
        event.preventDefault();

        if (!versionDocument) return;

        const erreurFichier = validerFichier(fichierVersion);

        if (erreurFichier) {
            setErreur(erreurFichier);
            return;
        }

        const reussi = await executerOperation(
            "version",
            () => ajouterVersion(
                token,
                versionDocument.id_document ?? versionDocument.id_doc,
                fichierVersion
            ),
            "Nouvelle version enregistrée. Lance son indexation."
        );

        if (reussi) {
            setVersionDocument(null);
            setFichierVersion(null);
        }
    }

    return (
        <section className="documents-page">

            {/* En-tête de gestion documentaire. */}
            <div className="documents-heading">
                <div>
                    <h1>Documents et indexation</h1>
                    <p>
                        Importez, organisez et indexez les documents
                        accessibles dans DocuMind.
                    </p>
                </div>

                <button
                    className="documents-primary-button"
                    type="button"
                    onClick={() => {
                        setErreur("");
                        setModalImport(true);
                    }}
                >
                    <Upload size={18} />
                    Importer un document
                </button>
            </div>

            {/* Cartes de statistiques. */}
            <div className="documents-stats">
                {[
                    {
                        titre: "Documents accessibles",
                        valeur: statistiques.total,
                        icone: FileText
                    },
                    {
                        titre: "Indexés",
                        valeur: statistiques.indexes,
                        icone: CheckCircle2
                    },
                    {
                        titre: "En attente",
                        valeur: statistiques.attente,
                        icone: Clock3
                    },
                    {
                        titre: "Erreurs",
                        valeur: statistiques.erreurs,
                        icone: AlertCircle
                    }
                ].map((stat) => {
                    const Icone = stat.icone;

                    return (
                        <div className="documents-stat" key={stat.titre}>
                            <Icone size={23} />
                            <span>{stat.titre}</span>
                            <strong>{stat.valeur}</strong>
                        </div>
                    );
                })}
            </div>

            {/* Messages de confirmation et d'erreur. */}
            {erreur && (
                <div className="documents-alert documents-alert-error" role="alert">
                    <AlertCircle size={18} />
                    <span>{erreur}</span>
                </div>
            )}

            {message && (
                <div className="documents-alert documents-alert-success" role="status">
                    <CheckCircle2 size={18} />
                    <span>{message}</span>
                </div>
            )}

            {/* Recherche et filtres. */}
            <div className="documents-toolbar">
                <div className="documents-search">
                    <Search size={19} />
                    <input
                        value={recherche}
                        onChange={(event) => setRecherche(event.target.value)}
                        placeholder="Rechercher un document..."
                        aria-label="Rechercher un document"
                    />
                </div>

                <select
                    value={filtreCollection}
                    onChange={(event) => setFiltreCollection(event.target.value)}
                    aria-label="Filtrer par collection"
                >
                    <option value="">Toutes les collections</option>
                    {collections.map((collection) => (
                        <option
                            key={collection.id_collection}
                            value={collection.id_collection}
                        >
                            {collection.collection_name}
                        </option>
                    ))}
                </select>

                <select
                    value={filtreStatut}
                    onChange={(event) => setFiltreStatut(event.target.value)}
                    aria-label="Filtrer par statut"
                >
                    <option value="">Tous les statuts</option>
                    <option value="indexed">Indexé</option>
                    <option value="pending">En attente</option>
                    <option value="error">Erreur</option>
                </select>

                <button
                    type="button"
                    className="documents-secondary-button"
                    onClick={() =>
                        executerOperation(
                            "refresh",
                            chargerDonnees,
                            "Liste actualisée."
                        )
                    }
                    disabled={Boolean(operation)}
                >
                    <RefreshCw size={17} />
                    Actualiser
                </button>
            </div>

            {/* Tableau des documents. */}
            <div className="documents-table-wrapper">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Collection</th>
                            <th>Taille</th>
                            <th>Version</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {!chargement && documentsFiltres.map((document) => {
                            const statut = statutDocument(document);
                            const occupe = Boolean(operation);

                            return (
                                <tr key={document.id_document ?? document.id_doc}>
                                    <td>
                                        <div className="documents-file-name">
                                            <FileText size={21} />
                                            <div>
                                                <strong>{document.titre}</strong>
                                                <small>
                                                    {String(
                                                        document.type_fichier ?? ""
                                                    ).toUpperCase()}
                                                </small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {nomsCollections[document.id_collection] ??
                                            `Collection ${document.id_collection}`}
                                    </td>

                                    <td>{formaterTaille(document.taille)}</td>

                                    <td>
                                        {document.version_num ??
                                            document.derniere_version?.numero ??
                                            "—"}
                                    </td>

                                    <td>
                                        <span className={`documents-status status-${statut}`}>
                                            {statut === "indexed"
                                                ? "Indexé"
                                                : statut === "pending"
                                                    ? "En attente"
                                                    : statut === "inconnu"
                                                        ? "Non renseigné"
                                                        : statut}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="documents-actions">
                                            <button
                                                type="button"
                                                title="Consulter"
                                                className="action-view"
                                                onClick={() => consulter(document)}
                                                disabled={occupe}
                                            >
                                                <Eye size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Télécharger"
                                                onClick={() => telecharger(document)}
                                                disabled={occupe}
                                            >
                                                <Download size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Indexer"
                                                onClick={() => lancerIndexation(document)}
                                                disabled={occupe || statut === "indexed"}
                                            >
                                                <RefreshCw size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Nouvelle version"
                                                onClick={() => {
                                                    setErreur("");
                                                    setVersionDocument(document);
                                                }}
                                                disabled={occupe}
                                            >
                                                <FilePlus2 size={17} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Supprimer"
                                                className="action-delete"
                                                onClick={() => supprimer(document)}
                                                disabled={occupe}
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {!chargement && documentsFiltres.length === 0 && (
                            <tr>
                                <td colSpan={6} className="documents-empty">
                                    Aucun document trouvé.
                                </td>
                            </tr>
                        )}

                        {chargement && (
                            <tr>
                                <td colSpan={6} className="documents-empty">
                                    Chargement des documents...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Fenêtre d'importation. */}
            {modalImport && (
                <div className="documents-modal-overlay">
                    <form
                        className="documents-modal"
                        onSubmit={soumettreImport}
                    >
                        <div className="documents-modal-header">
                            <h2>
                                <Upload size={21} />
                                Importer un document
                            </h2>
                            <button
                                type="button"
                                onClick={() => setModalImport(false)}
                                aria-label="Fermer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <label>
                            Collection documentaire
                            <select
                                required
                                value={collectionImport}
                                onChange={(event) =>
                                    setCollectionImport(event.target.value)
                                }
                            >
                                <option value="">Choisir une collection</option>
                                {collections
                                    .filter((collection) => collection.est_active)
                                    .map((collection) => (
                                        <option
                                            key={collection.id_collection}
                                            value={collection.id_collection}
                                        >
                                            {collection.collection_name}
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <label>
                            Fichier PDF, DOCX ou TXT
                            <input
                                required
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={(event) =>
                                    setFichierImport(event.target.files?.[0] ?? null)
                                }
                            />
                        </label>

                        <p className="documents-help">
                            Taille maximale : 20 Mo. L'indexation sera
                            lancée après l'importation.
                        </p>

                        <button
                            type="submit"
                            className="documents-primary-button"
                            disabled={Boolean(operation)}
                        >
                            <Upload size={17} />
                            {operation === "import"
                                ? "Importation..."
                                : "Importer"}
                        </button>
                    </form>
                </div>
            )}

            {/* Fenêtre d'ajout d'une version. */}
            {versionDocument && (
                <div className="documents-modal-overlay">
                    <form
                        className="documents-modal"
                        onSubmit={soumettreVersion}
                    >
                        <div className="documents-modal-header">
                            <h2>
                                <Layers size={21} />
                                Nouvelle version
                            </h2>
                            <button
                                type="button"
                                onClick={() => setVersionDocument(null)}
                                aria-label="Fermer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p>
                            Document : <strong>{versionDocument.titre}</strong>
                        </p>

                        <label>
                            Nouveau fichier
                            <input
                                required
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={(event) =>
                                    setFichierVersion(event.target.files?.[0] ?? null)
                                }
                            />
                        </label>

                        <p className="documents-help">Le backend actuel enregistre le fichier sans commentaire de version.</p>

                        <button
                            type="submit"
                            className="documents-primary-button"
                            disabled={Boolean(operation)}
                        >
                            <FilePlus2 size={17} />
                            {operation === "version"
                                ? "Enregistrement..."
                                : "Enregistrer la version"}
                        </button>
                    </form>
                </div>
            )}

            {/* Boutons fixes au centre de la zone de travail. */}
            <div className="documents-collections-fixed">
                <button type="button" className="documents-collection-create"
                    onClick={() => ouvrirFormulaireCollection()} disabled={Boolean(operation)}>
                    <FolderPlus size={18} /> Nouvelle collection
                </button>
                <button type="button" className="documents-collection-manage"
                    onClick={() => { setErreur(""); setMessage(""); setModalGestionCollections(true); }}
                    disabled={Boolean(operation)}>
                    <Folders size={18} /> Gérer les collections
                </button>
            </div>

            {/* Formulaire de création ou de modification d'une collection. */}
            {modalNouvelleCollection && (
                <div className="documents-modal-overlay">
                    <form className="documents-modal" onSubmit={enregistrerCollection}
                        role="dialog" aria-modal="true" aria-label="Formulaire de collection">
                        <div className="documents-modal-header">
                            <h2><FolderPlus size={21} />
                                {collectionEdition ? "Modifier la collection" : "Nouvelle collection"}
                            </h2>
                            <button type="button" aria-label="Fermer" onClick={fermerFormulaireCollection}>
                                <X size={20} />
                            </button>
                        </div>
                        {erreur && <p className="documents-collection-error" role="alert">{erreur}</p>}
                        <label>Nom de la collection
                            <input type="text" required minLength={2} maxLength={150}
                                value={formCollection.collection_name}
                                onChange={(event) => setFormCollection((prev) => ({
                                    ...prev, collection_name: event.target.value
                                }))} />
                        </label>
                        <label>Description (facultative)
                            <textarea rows={3} maxLength={500} value={formCollection.description}
                                onChange={(event) => setFormCollection((prev) => ({
                                    ...prev, description: event.target.value
                                }))} />
                        </label>
                        <label>Niveau d'accès
                            <select required value={formCollection.niveau_acces}
                                onChange={(event) => setFormCollection((prev) => ({
                                    ...prev, niveau_acces: event.target.value
                                }))}>
                                {["Public", "Interne", "Restreint", "Confidentiel"].map((niveau) => (
                                    <option key={niveau} value={niveau}>{niveau}</option>
                                ))}
                            </select>
                        </label>
                        <button type="submit" className="documents-primary-button"
                            disabled={Boolean(operation)}>
                            {operation === "collection-save" ? "Enregistrement..." :
                                collectionEdition ? "Enregistrer les modifications" : "Créer la collection"}
                        </button>
                    </form>
                </div>
            )}

            {/* Liste des collections et commandes de gestion. */}
            {modalGestionCollections && (
                <div className="documents-modal-overlay">
                    <div className="documents-modal documents-collections-modal"
                        role="dialog" aria-modal="true" aria-label="Gérer les collections">
                        <div className="documents-modal-header">
                            <h2><Folders size={21} /> Gérer les collections</h2>
                            <button type="button" aria-label="Fermer"
                                onClick={() => { setModalGestionCollections(false); setErreur(""); }}>
                                <X size={20} />
                            </button>
                        </div>
                        {erreur && <p className="documents-collection-error" role="alert">{erreur}</p>}
                        {message && <p className="documents-collection-success" role="status">{message}</p>}
                        {collections.length === 0 && <p>Aucune collection disponible.</p>}
                        <div className="documents-collections-list">
                            {collections.map((collection) => (
                                <div className="documents-collection-item" key={collection.id_collection}>
                                    <div className="documents-collection-info">
                                        <strong>{collection.collection_name}</strong>
                                        <small>{collection.niveau_acces} · {collection.est_active ? "Active" : "Inactive"}</small>
                                        {collection.description && <p>{collection.description}</p>}
                                    </div>
                                    <div className="documents-collection-item-actions">
                                        <button type="button" title="Modifier" disabled={Boolean(operation)}
                                            aria-label={`Modifier ${collection.collection_name}`}
                                            onClick={() => ouvrirFormulaireCollection(collection)}>
                                            <Pencil size={17} />
                                        </button>
                                        <button type="button" disabled={Boolean(operation)}
                                            title={collection.est_active ? "Désactiver" : "Activer"}
                                            aria-label={`${collection.est_active ? "Désactiver" : "Activer"} ${collection.collection_name}`}
                                            onClick={() => basculerStatutCollection(collection)}>
                                            <Power size={17} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lecteur documentaire déjà développé. */}
            {documentOuvert && (
                <DocumentViewer
                    document={documentOuvert}
                    token={token}
                    onClose={() => setDocumentOuvert(null)}
                />
            )}
        </section>
    );
}


/*
  Enrichir les documents avec leur dernière version.

  GET /documents retourne id_document, mais pas le
  statut ni le numéro de version.

  GET /documents/{id_document} retourne ces informations.
*/
async function chargerDocumentsComplets(token) {
    const documents = await listerDocuments(token);

    if (!Array.isArray(documents)) {
        throw new Error("Format de liste documentaire inattendu.");
    }

    const resultats = await Promise.allSettled(
        documents.map(async (document) => {
            const details = await obtenirDocument(
                token,
                document.id_document ?? document.id_doc
            );

            return {
                ...document,
                ...details,

                // Conserver id_doc pour les composants existants.
                id_doc: document.id_document ?? document.id_doc,

                // Extraire les informations de la dernière version.
                statut: details.derniere_version?.statut ?? "inconnu",
                version_num: details.derniere_version?.numero ?? null
            };
        })
    );

    // Conserver les documents même si leurs détails échouent.
    return resultats.map((resultat, index) => {
        if (resultat.status === "fulfilled") {
            return resultat.value;
        }

        console.error("Impossible de charger les détails :", documents[index].titre, resultat.reason);

        return {
            ...documents[index],
            id_doc: documents[index].id_document ?? documents[index].id_doc,
            statut: "inconnu",
            version_num: null
        };
    });
}


export default DocumentsIndexation;
