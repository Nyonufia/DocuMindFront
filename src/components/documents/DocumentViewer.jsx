import { useEffect, useState } from "react";
import {
  X,
  Download,
  FileText,
  LoaderCircle,
  AlertCircle
} from "lucide-react";

import mammoth from "mammoth";
import DOMPurify from "dompurify";

import { recupererDocument } from "../../services/rechercheService";
import "./DocumentViewer.css";

/*
  Lecteur intégré de documents DocuMind.

  Formats pris en charge :
  - PDF : affichage dans un iframe
  - TXT : affichage du texte
  - DOCX : conversion en HTML sécurisé

  Le fichier est récupéré depuis FastAPI avec
  le JWT de l'utilisateur connecté.
*/

function DocumentViewer({
  document,
  token,
  onClose
}) {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [contenuTexte, setContenuTexte] = useState("");
  const [contenuHTML, setContenuHTML] = useState("");
  const [urlPDF, setUrlPDF] = useState("");
  const [fichier, setFichier] = useState(null);

  const idDocument = document?.id_doc;

  const nomDocument =
    document?.titre ||
    document?.nom_fichier ||
    `Document ${idDocument}`;

  // Déterminer le format à partir du nom du fichier.
  const extension = String(
  document?.type_fichier ||
  document?.titre?.split(".").pop() ||
  document?.nom_fichier?.split(".").pop() ||
  ""
)
  .toLowerCase()
  .replace(/^\./, "")
  .trim();

  useEffect(() => {
    if (!idDocument || !token) return;

    let actif = true;
    let urlTemporaire = null;

    // Charger le fichier depuis le backend sécurisé.
    async function chargerDocument() {
      try {
        const blob = await recupererDocument(token, idDocument);

        if (!actif) return;

        setFichier(blob);

        // PDF : créer une URL temporaire pour l'iframe.
        if (extension === "pdf") {
          urlTemporaire = URL.createObjectURL(blob);
          setUrlPDF(urlTemporaire);
        }

        // TXT : convertir le contenu en texte.
        else if (extension === "txt") {
          const texte = await blob.text();

          if (actif) {
            setContenuTexte(texte);
          }
        }

        // DOCX : convertir le fichier en HTML.
        else if (extension === "docx") {
          const buffer = await blob.arrayBuffer();

          const resultat = await mammoth.convertToHtml({
            arrayBuffer: buffer
          });

          if (actif) {
            setContenuHTML(
              DOMPurify.sanitize(resultat.value)
            );
          }
        }

        else {
          throw new Error(
            "Ce format ne peut pas être prévisualisé."
          );
        }
      } catch (err) {
        if (actif) {
          setErreur(err.message);
        }
      } finally {
        if (actif) {
          setChargement(false);
        }
      }
    }

    chargerDocument();

    // Libérer l'URL temporaire lorsque le lecteur se ferme.
    return () => {
      actif = false;

      if (urlTemporaire) {
        URL.revokeObjectURL(urlTemporaire);
      }
    };
  }, [idDocument, token, extension]);

  // Télécharger le document original.
  function telechargerDocument() {
    if (!fichier) return;

    const url = URL.createObjectURL(fichier);
    const lien = window.document.createElement("a");

    lien.href = url;
    lien.download = nomDocument;

    window.document.body.appendChild(lien);
    lien.click();
    lien.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="document-viewer-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="document-viewer-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Consultation de ${nomDocument}`}
      >

        {/* En-tête du lecteur documentaire. */}
        <header className="document-viewer-header">
          <div className="document-viewer-title">
            <FileText size={24} />

            <div>
              <h2>{nomDocument}</h2>
              <p>
                Aperçu sécurisé · {extension.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="document-viewer-actions">
            <button
              type="button"
              onClick={telechargerDocument}
              disabled={!fichier}
              title="Télécharger"
            >
              <Download size={20} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Fermer"
              aria-label="Fermer le document"
            >
              <X size={23} />
            </button>
          </div>
        </header>

        {/* Zone de lecture du document. */}
        <div className="document-viewer-body">

          {chargement ? (
            <div className="document-viewer-state">
              <LoaderCircle
                size={38}
                className="rag-spin"
              />
              <p>Chargement du document...</p>
            </div>
          ) : erreur ? (
            <div className="document-viewer-state error">
              <AlertCircle size={38} />
              <p>{erreur}</p>
            </div>
          ) : extension === "pdf" ? (
            <iframe
              src={urlPDF}
              title={nomDocument}
              className="document-viewer-pdf"
            />
          ) : extension === "txt" ? (
            <article className="document-viewer-paper">
              <pre>{contenuTexte}</pre>
            </article>
          ) : extension === "docx" ? (
            <article
              className="document-viewer-paper document-viewer-docx"
              dangerouslySetInnerHTML={{
                __html: contenuHTML
              }}
            />
          ) : null}

        </div>
      </section>
    </div>
  );
}

export default DocumentViewer;
