import { languageCode } from './languageCode';

// What every control on Job postings does, taken from the page itself: the two
// tabs, the import form, the result actions, and what a kept posting can do.
// The last section states the honest limit, because a search that returns
// nothing looks like a fault unless someone says where results come from.

const en = {
  title: 'How this page works',
  intro: 'Find the job, keep it, and tailor a résumé to what it asks for.',
  sections: [
    { heading: 'Finding a posting', items: [
      'Search from criteria: role, place, category. Searches the boards that allow it.',
      'Search from profile: the studio builds the search from your history and target titles.',
      'Sources lists the job boards themselves. Each is labelled by how it is reached: Auto-Searched, Web-Indexed, or Manual.'
    ] },
    { heading: 'Adding one you already have', items: [
      'Paste the link, or paste the whole description as text.',
      'A link that will not load can always be pasted as text instead.',
      'Nothing is guessed: if the description comes through short, the tailoring that follows will be short too.'
    ] },
    { heading: 'Working through results', items: [
      'Keep saves the posting here so you can come back to it.',
      'Tailor résumé goes straight to the tailoring step with this posting attached.',
      'Dismiss drops a result you do not want. Clear empties the whole result set.',
      'Results are the board’s own search, not a private index, so a thin result set means a thin search term.'
    ] },
    { heading: 'A kept posting', items: [
      'Tailor résumé builds a résumé and cover letter aimed at this posting.',
      'Open posting goes to the original advert in a new tab.',
      'View résumé opens the application once a résumé has been tailored for it.',
      'Remove deletes the posting. Clear all empties the list.'
    ] },
    { heading: 'What travels with it', items: [
      'A tailored résumé keeps the posting it was built for, so you can see what was asked later.',
      'Only real history and reference files are used. The posting shapes the wording, never the facts.',
      'Board labels are not decoration: Manual boards need you to paste, and the page will not pretend otherwise.'
    ] }
  ]
};

const de = {
  title: 'So funktioniert diese Seite',
  intro: 'Stelle finden, behalten und einen Lebenslauf darauf zuschneiden.',
  sections: [
    { heading: 'Eine Anzeige finden', items: [
      'Suche nach Kriterien: Rolle, Ort, Kategorie. Durchsucht die Börsen, die es erlauben.',
      'Suche aus dem Profil: das Studio baut die Suche aus Verlauf und Zielpositionen.',
      'Quellen listet die Börsen. Jede ist gekennzeichnet: automatisch durchsucht, web-indexiert oder manuell.'
    ] },
    { heading: 'Selbst gefundene Anzeige', items: [
      'Link einfügen oder den Text der Anzeige einfügen.',
      'Ein Link, der nicht lädt, lässt sich immer als Text einfügen.',
      'Nichts wird geschätzt: kommt die Beschreibung kurz an, wird auch der Zuschnitt kurz.'
    ] },
    { heading: 'Ergebnisse durchgehen', items: [
      'Behalten speichert die Anzeige hier.',
      'Lebenslauf zuschneiden springt direkt zum Zuschnitt mit dieser Anzeige.',
      'Verwerfen entfernt ein Ergebnis. Leeren räumt alle Ergebnisse.',
      'Ergebnisse sind die Suche der Börse selbst, kein eigener Index.'
    ] },
    { heading: 'Eine behaltene Anzeige', items: [
      'Lebenslauf zuschneiden erstellt Lebenslauf und Anschreiben für diese Anzeige.',
      'Anzeige öffnen führt zum Original in einem neuen Tab.',
      'Lebenslauf ansehen öffnet die Bewerbung, sobald ein Lebenslauf erstellt wurde.',
      'Entfernen löscht die Anzeige. Alle entfernen leert die Liste.'
    ] },
    { heading: 'Was mitgeht', items: [
      'Ein zugeschnittener Lebenslauf behält die Anzeige, für die er gebaut wurde.',
      'Nur echter Verlauf und echte Referenzdateien werden genutzt. Die Anzeige formt die Worte, nie die Fakten.',
      'Die Kennzeichnung der Börsen ist keine Zierde: manuelle Börsen verlangen Einfügen.'
    ] }
  ]
};

const fr = {
  title: 'Comment fonctionne cette page',
  intro: 'Trouver l’offre, la garder, et adapter un CV à ce qu’elle demande.',
  sections: [
    { heading: 'Trouver une offre', items: [
      'Recherche par critères : poste, lieu, catégorie. Interroge les sites qui l’autorisent.',
      'Recherche depuis le profil : le studio construit la recherche à partir de votre parcours.',
      'Sources liste les sites. Chacun est étiqueté : recherche automatique, indexé web, ou manuel.'
    ] },
    { heading: 'Ajouter une offre que vous avez', items: [
      'Collez le lien, ou collez le texte de l’annonce.',
      'Un lien qui ne charge pas peut toujours être collé en texte.',
      'Rien n’est deviné : une description courte donnera une adaptation courte.'
    ] },
    { heading: 'Parcourir les résultats', items: [
      'Garder enregistre l’offre ici.',
      'Adapter le CV va directement à l’adaptation avec cette offre.',
      'Écarter retire un résultat. Effacer vide l’ensemble.',
      'Les résultats viennent de la recherche du site, pas d’un index privé.'
    ] },
    { heading: 'Une offre gardée', items: [
      'Adapter le CV produit un CV et une lettre pour cette offre.',
      'Ouvrir l’offre mène à l’annonce d’origine.',
      'Voir le CV ouvre la candidature une fois le CV créé.',
      'Retirer supprime l’offre. Tout effacer vide la liste.'
    ] },
    { heading: 'Ce qui l’accompagne', items: [
      'Un CV adapté conserve l’offre pour laquelle il a été fait.',
      'Seuls le parcours réel et vos fichiers sont utilisés. L’offre change les mots, jamais les faits.',
      'Les étiquettes des sites ne sont pas décoratives : les sites manuels demandent un collage.'
    ] }
  ]
};

const es = {
  title: 'Cómo funciona esta página',
  intro: 'Encuentra la oferta, guárdala y adapta un CV a lo que pide.',
  sections: [
    { heading: 'Encontrar una oferta', items: [
      'Buscar por criterios: puesto, lugar, categoría. Consulta los portales que lo permiten.',
      'Buscar desde el perfil: el estudio arma la búsqueda con tu historial y puestos objetivo.',
      'Fuentes lista los portales. Cada uno indica cómo se accede: búsqueda automática, indexado web o manual.'
    ] },
    { heading: 'Añadir una que ya tienes', items: [
      'Pega el enlace, o pega el texto completo de la oferta.',
      'Un enlace que no carga siempre se puede pegar como texto.',
      'No se adivina nada: si la descripción llega corta, la adaptación también será corta.'
    ] },
    { heading: 'Revisar resultados', items: [
      'Guardar deja la oferta aquí.',
      'Adaptar CV va directo a la adaptación con esta oferta.',
      'Descartar quita un resultado. Limpiar vacía el conjunto.',
      'Los resultados son la búsqueda del portal, no un índice propio.'
    ] },
    { heading: 'Una oferta guardada', items: [
      'Adaptar CV crea CV y carta para esta oferta.',
      'Abrir oferta lleva al anuncio original.',
      'Ver CV abre la candidatura cuando ya existe un CV.',
      'Eliminar borra la oferta. Borrar todo vacía la lista.'
    ] },
    { heading: 'Lo que viaja con ella', items: [
      'Un CV adaptado conserva la oferta para la que se hizo.',
      'Solo se usa historial real y tus archivos. La oferta cambia las palabras, nunca los hechos.',
      'Las etiquetas de los portales importan: los manuales exigen pegar.'
    ] }
  ]
};

const it = {
  title: 'Come funziona questa pagina',
  intro: 'Trova l’annuncio, tienilo, e adatta un CV a ciò che chiede.',
  sections: [
    { heading: 'Trovare un annuncio', items: [
      'Cerca per criteri: ruolo, luogo, categoria. Interroga i portali che lo permettono.',
      'Cerca dal profilo: lo studio costruisce la ricerca dalla tua storia e dai ruoli obiettivo.',
      'Fonti elenca i portali. Ognuno indica come si raggiunge: ricerca automatica, indicizzato web o manuale.'
    ] },
    { heading: 'Aggiungerne uno che hai già', items: [
      'Incolla il link, o incolla il testo dell’annuncio.',
      'Un link che non carica si può sempre incollare come testo.',
      'Nulla viene indovinato: una descrizione breve dà un adattamento breve.'
    ] },
    { heading: 'Scorrere i risultati', items: [
      'Tieni salva l’annuncio qui.',
      'Adatta CV va diretto all’adattamento con questo annuncio.',
      'Scarta rimuove un risultato. Pulisci svuota il set.',
      'I risultati sono la ricerca del portale, non un indice privato.'
    ] },
    { heading: 'Un annuncio tenuto', items: [
      'Adatta CV crea CV e lettera per questo annuncio.',
      'Apri annuncio porta all’originale.',
      'Vedi CV apre la candidatura quando il CV esiste.',
      'Rimuovi elimina l’annuncio. Rimuovi tutto svuota la lista.'
    ] },
    { heading: 'Cosa viaggia con esso', items: [
      'Un CV adattato conserva l’annuncio per cui è stato fatto.',
      'Si usano solo storia reale e i tuoi file. L’annuncio cambia le parole, mai i fatti.',
      'Le etichette dei portali contano: quelli manuali richiedono di incollare.'
    ] }
  ]
};

const pt = {
  title: 'Como esta página funciona',
  intro: 'Encontre a vaga, guarde-a e adapte um currículo ao que ela pede.',
  sections: [
    { heading: 'Encontrar uma vaga', items: [
      'Pesquisar por critérios: função, local, categoria. Consulta os portais que o permitem.',
      'Pesquisar pelo perfil: o estúdio constrói a pesquisa a partir do histórico e dos cargos alvo.',
      'Fontes lista os portais. Cada um indica como é acedido: pesquisa automática, indexado na web ou manual.'
    ] },
    { heading: 'Adicionar uma que já tem', items: [
      'Cole a ligação, ou cole o texto do anúncio.',
      'Uma ligação que não carrega pode sempre ser colada como texto.',
      'Nada é adivinhado: uma descrição curta dá uma adaptação curta.'
    ] },
    { heading: 'Percorrer resultados', items: [
      'Guardar mantém a vaga aqui.',
      'Adaptar currículo vai direto à adaptação com esta vaga.',
      'Descartar remove um resultado. Limpar esvazia o conjunto.',
      'Os resultados são a pesquisa do portal, não um índice próprio.'
    ] },
    { heading: 'Uma vaga guardada', items: [
      'Adaptar currículo cria currículo e carta para esta vaga.',
      'Abrir vaga leva ao anúncio original.',
      'Ver currículo abre a candidatura quando já existe currículo.',
      'Remover elimina a vaga. Remover tudo esvazia a lista.'
    ] },
    { heading: 'O que viaja com ela', items: [
      'Um currículo adaptado guarda a vaga para a qual foi feito.',
      'Só histórico real e os seus ficheiros são usados. A vaga muda as palavras, nunca os factos.',
      'As etiquetas dos portais não são decoração: os manuais exigem colar.'
    ] }
  ]
};

export const JOB_POSTINGS_GUIDE = { en, de, fr, es, it, pt };

export function jobPostingsGuide(language) {
  return JOB_POSTINGS_GUIDE[languageCode(language)];
}
