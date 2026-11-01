import { languageCode } from './languageCode';

// What every control on the Career history page does. Written from the page
// itself: the dictation box, the follow-up prompts, the draft editor, the entry
// row actions, and the capture button that turns a set of entries into the
// summary every résumé is built from.
//
// Two rules are stated plainly because they are easy to get wrong: hidden
// entries stay in the record but leave every résumé, and a capture that needs
// saving means the summary no longer describes the entries.

const en = {
  title: 'How this page works',
  intro: 'Talk or type one job at a time. This is the record every résumé is written from.',
  sections: [
    {
      heading: 'Giving an entry',
      items: [
        'Press the microphone and talk, or type into the box.',
        'Say what the job was, roughly when, and one thing that changed because you were there.',
        'Press add when you are done. The studio splits it into a draft entry for you to check.',
        'Only one entry is open at a time. Finish or discard it before starting the next.',
        'Saying "resume history is complete" out loud runs the capture.'
      ]
    },
    {
      heading: 'Follow-up questions',
      items: [
        'The studio asks for detail it could not infer: numbers, tools, outcomes.',
        'Answer with a detail, pass on a question, or skip a whole set.',
        'Nothing is invented to fill a gap. An unanswered question stays unanswered.'
      ]
    },
    {
      heading: 'Checking the draft',
      items: [
        'The draft editor shows employer, title, dates and the wording of your work.',
        'Correct anything that was heard wrong before you save it.',
        'Save puts the entry in your history. Nothing leaves the app.'
      ]
    },
    {
      heading: 'Each entry in the list',
      items: [
        'Edit changes the wording, dates or employer.',
        'Review asks the follow-up questions again for that entry.',
        'Hide keeps the entry in your record but takes it out of every résumé, search and grade. It stays reversible.',
        'Combine merges two entries for the same employer into one, so a list of roles reads as a career.',
        'Delete removes an entry for good. This cannot be undone.'
      ]
    },
    {
      heading: 'Saving the capture',
      items: [
        'Red means the entries have changed since the last save, so the summary is behind.',
        'Green means what is saved matches the entries on screen.',
        'Pressing the button rewrites your summary, skills and target titles from the entries.',
        'New entries reach a résumé either way, but the summary only catches up when you save.'
      ]
    },
    {
      heading: 'Using it',
      items: [
        'See my current résumé previews what exists right now, with no job posting and no tailoring.',
        'Job postings and applications draw on this history. Nothing is stored anywhere else.',
        'Clear history wipes the record for a fresh start. It is for testing, not for tidying.'
      ]
    }
  ]
};

const de = {
  title: 'So funktioniert diese Seite',
  intro: 'Eine Stelle nach der anderen, gesprochen oder getippt. Aus diesem Datensatz entsteht jeder Lebenslauf.',
  sections: [
    { heading: 'Einen Eintrag erfassen', items: [
      'Mikrofon drücken und sprechen, oder in das Feld tippen.',
      'Nennen Sie die Stelle, ungefähr den Zeitraum und eine Sache, die sich dadurch geändert hat.',
      'Danach auf Hinzufügen. Das Studio erstellt daraus einen Entwurf zur Prüfung.',
      'Es ist immer nur ein Eintrag offen. Abschließen oder verwerfen, dann weiter.',
      'Sagen Sie „resume history is complete“, wird die Sicherung ausgelöst.'
    ] },
    { heading: 'Rückfragen', items: [
      'Das Studio fragt nach Details, die es nicht ableiten kann: Zahlen, Werkzeuge, Ergebnisse.',
      'Antworten Sie mit einem Detail, überspringen Sie eine Frage oder einen ganzen Satz.',
      'Nichts wird erfunden, um eine Lücke zu füllen.'
    ] },
    { heading: 'Entwurf prüfen', items: [
      'Der Editor zeigt Arbeitgeber, Titel, Zeitraum und die Formulierung Ihrer Arbeit.',
      'Korrigieren Sie, was falsch verstanden wurde, bevor Sie speichern.',
      'Speichern legt den Eintrag in Ihrem Verlauf ab. Nichts verlässt die App.'
    ] },
    { heading: 'Jeder Eintrag in der Liste', items: [
      'Bearbeiten ändert Formulierung, Zeitraum oder Arbeitgeber.',
      'Prüfen stellt die Rückfragen für diesen Eintrag erneut.',
      'Ausblenden behält den Eintrag, nimmt ihn aber aus jedem Lebenslauf, jeder Suche und Bewertung. Umkehrbar.',
      'Zusammenführen fasst zwei Einträge desselben Arbeitgebers zusammen.',
      'Löschen entfernt einen Eintrag endgültig. Nicht umkehrbar.'
    ] },
    { heading: 'Sicherung speichern', items: [
      'Rot heißt: die Einträge haben sich seit der letzten Sicherung geändert.',
      'Grün heißt: gespeichert und angezeigt stimmen überein.',
      'Der Knopf schreibt Zusammenfassung, Fähigkeiten und Zielpositionen neu.',
      'Neue Einträge erreichen den Lebenslauf trotzdem, die Zusammenfassung erst beim Speichern.'
    ] },
    { heading: 'Verwendung', items: [
      'Aktuellen Lebenslauf ansehen zeigt den Stand ohne Stellenanzeige und ohne Zuschnitt.',
      'Stellenanzeigen und Bewerbungen greifen auf diesen Verlauf zu.',
      'Verlauf löschen setzt den Datensatz zurück. Für Tests, nicht zum Aufräumen.'
    ] }
  ]
};

const fr = {
  title: 'Comment fonctionne cette page',
  intro: 'Un poste à la fois, parlé ou tapé. C’est l’enregistrement dont chaque CV est tiré.',
  sections: [
    { heading: 'Saisir une entrée', items: [
      'Appuyez sur le micro et parlez, ou tapez dans le champ.',
      'Dites le poste, la période approximative, et une chose qui a changé grâce à vous.',
      'Appuyez sur ajouter. Le studio en fait un brouillon à vérifier.',
      'Une seule entrée est ouverte à la fois. Terminez-la ou abandonnez-la.',
      'Dire « resume history is complete » lance l’enregistrement.'
    ] },
    { heading: 'Questions de suivi', items: [
      'Le studio demande ce qu’il ne peut pas déduire : chiffres, outils, résultats.',
      'Répondez avec un détail, passez une question ou tout un lot.',
      'Rien n’est inventé pour combler un manque.'
    ] },
    { heading: 'Vérifier le brouillon', items: [
      'L’éditeur montre l’employeur, l’intitulé, les dates et la formulation de votre travail.',
      'Corrigez ce qui a été mal entendu avant d’enregistrer.',
      'Enregistrer place l’entrée dans votre parcours. Rien ne quitte l’application.'
    ] },
    { heading: 'Chaque entrée de la liste', items: [
      'Modifier change la formulation, les dates ou l’employeur.',
      'Relire repose les questions de suivi pour cette entrée.',
      'Masquer garde l’entrée mais la retire de tout CV, recherche et évaluation. Réversible.',
      'Combiner réunit deux entrées du même employeur.',
      'Supprimer efface définitivement. Irréversible.'
    ] },
    { heading: 'Enregistrer la capture', items: [
      'Rouge : les entrées ont changé depuis le dernier enregistrement.',
      'Vert : le contenu enregistré correspond aux entrées affichées.',
      'Le bouton réécrit le résumé, les compétences et les intitulés visés.',
      'Les nouvelles entrées arrivent au CV, mais le résumé seulement après enregistrement.'
    ] },
    { heading: 'Utilisation', items: [
      'Voir mon CV actuel montre l’état actuel, sans offre ni adaptation.',
      'Les offres et les candidatures s’appuient sur ce parcours.',
      'Effacer le parcours remet à zéro. Pour les tests, pas pour ranger.'
    ] }
  ]
};

const es = {
  title: 'Cómo funciona esta página',
  intro: 'Un puesto a la vez, hablado o escrito. De este registro sale cada CV.',
  sections: [
    { heading: 'Añadir una entrada', items: [
      'Pulsa el micrófono y habla, o escribe en la caja.',
      'Di el puesto, la época aproximada y algo que cambió porque estuviste ahí.',
      'Pulsa añadir. El estudio lo convierte en un borrador para revisar.',
      'Solo hay una entrada abierta a la vez. Termínala o descártala.',
      'Decir «resume history is complete» en voz alta lanza la captura.'
    ] },
    { heading: 'Preguntas de seguimiento', items: [
      'El estudio pregunta lo que no puede deducir: cifras, herramientas, resultados.',
      'Responde con un detalle, pasa una pregunta o un bloque entero.',
      'No se inventa nada para rellenar un hueco.'
    ] },
    { heading: 'Revisar el borrador', items: [
      'El editor muestra empresa, puesto, fechas y la redacción de tu trabajo.',
      'Corrige lo que se oyó mal antes de guardar.',
      'Guardar añade la entrada a tu historial. Nada sale de la app.'
    ] },
    { heading: 'Cada entrada de la lista', items: [
      'Editar cambia la redacción, las fechas o la empresa.',
      'Revisar vuelve a hacer las preguntas de esa entrada.',
      'Ocultar mantiene la entrada pero la saca de todo CV, búsqueda y nota. Reversible.',
      'Combinar une dos entradas de la misma empresa.',
      'Eliminar borra para siempre. No se deshace.'
    ] },
    { heading: 'Guardar la captura', items: [
      'Rojo: las entradas cambiaron desde el último guardado.',
      'Verde: lo guardado coincide con lo que ves.',
      'El botón reescribe resumen, aptitudes y puestos objetivo.',
      'Las entradas nuevas llegan al CV igual, pero el resumen solo al guardar.'
    ] },
    { heading: 'Para qué sirve', items: [
      'Ver mi CV actual muestra lo que hay, sin oferta y sin adaptar.',
      'Las ofertas y candidaturas usan este historial.',
      'Borrar historial reinicia el registro. Para pruebas, no para ordenar.'
    ] }
  ]
};

const it = {
  title: 'Come funziona questa pagina',
  intro: 'Un lavoro alla volta, parlato o scritto. Da questo registro nasce ogni CV.',
  sections: [
    { heading: 'Inserire una voce', items: [
      'Premi il microfono e parla, oppure scrivi nel riquadro.',
      'Di’ il ruolo, il periodo approssimativo e una cosa cambiata grazie a te.',
      'Premi aggiungi. Lo studio ne fa una bozza da controllare.',
      'Si apre una voce alla volta. Concludila o scartala.',
      'Dire «resume history is complete» avvia la cattura.'
    ] },
    { heading: 'Domande di seguito', items: [
      'Lo studio chiede ciò che non può dedurre: numeri, strumenti, risultati.',
      'Rispondi con un dettaglio, salta una domanda o un blocco.',
      'Non viene inventato nulla per riempire un vuoto.'
    ] },
    { heading: 'Controllare la bozza', items: [
      'L’editor mostra azienda, ruolo, date e la formulazione del lavoro.',
      'Correggi ciò che è stato sentito male prima di salvare.',
      'Salva inserisce la voce nella storia. Nulla esce dall’app.'
    ] },
    { heading: 'Ogni voce della lista', items: [
      'Modifica cambia formulazione, date o azienda.',
      'Rivedi ripropone le domande per quella voce.',
      'Nascondi tiene la voce ma la toglie da ogni CV, ricerca e valutazione. Reversibile.',
      'Unisci accorpa due voci della stessa azienda.',
      'Elimina cancella definitivamente. Non reversibile.'
    ] },
    { heading: 'Salvare la cattura', items: [
      'Rosso: le voci sono cambiate dopo l’ultimo salvataggio.',
      'Verde: il salvato corrisponde a ciò che vedi.',
      'Il pulsante riscrive sintesi, competenze e ruoli obiettivo.',
      'Le nuove voci arrivano al CV comunque, la sintesi solo al salvataggio.'
    ] },
    { heading: 'A cosa serve', items: [
      'Vedi il CV attuale mostra ciò che esiste, senza annuncio e senza adattamento.',
      'Annunci e candidature usano questa storia.',
      'Cancella storia azzera il registro. Per prove, non per riordinare.'
    ] }
  ]
};

const pt = {
  title: 'Como esta página funciona',
  intro: 'Um trabalho de cada vez, falado ou escrito. É deste registo que sai cada currículo.',
  sections: [
    { heading: 'Registar uma entrada', items: [
      'Carregue no microfone e fale, ou escreva na caixa.',
      'Diga o cargo, a época aproximada e algo que mudou por ter estado lá.',
      'Carregue em adicionar. O estúdio cria um rascunho para verificar.',
      'Só há uma entrada aberta de cada vez. Conclua ou descarte.',
      'Dizer «resume history is complete» inicia a captura.'
    ] },
    { heading: 'Perguntas de seguimento', items: [
      'O estúdio pergunta o que não consegue deduzir: números, ferramentas, resultados.',
      'Responda com um detalhe, passe uma pergunta ou um conjunto.',
      'Nada é inventado para preencher uma falha.'
    ] },
    { heading: 'Verificar o rascunho', items: [
      'O editor mostra empresa, cargo, datas e a redação do seu trabalho.',
      'Corrija o que foi mal ouvido antes de guardar.',
      'Guardar coloca a entrada no histórico. Nada sai da aplicação.'
    ] },
    { heading: 'Cada entrada da lista', items: [
      'Editar altera redação, datas ou empresa.',
      'Rever volta a fazer as perguntas dessa entrada.',
      'Ocultar mantém a entrada mas tira-a de todo o currículo, pesquisa e avaliação. Reversível.',
      'Combinar junta duas entradas da mesma empresa.',
      'Eliminar apaga definitivamente. Não é reversível.'
    ] },
    { heading: 'Guardar a captura', items: [
      'Vermelho: as entradas mudaram desde o último guardar.',
      'Verde: o guardado corresponde ao que está no ecrã.',
      'O botão reescreve resumo, competências e cargos alvo.',
      'Entradas novas chegam ao currículo de qualquer forma, o resumo só ao guardar.'
    ] },
    { heading: 'Para que serve', items: [
      'Ver o currículo atual mostra o que existe, sem vaga e sem adaptação.',
      'Vagas e candidaturas usam este histórico.',
      'Limpar histórico reinicia o registo. Para testes, não para arrumar.'
    ] }
  ]
};

export const CAREER_HISTORY_GUIDE = { en, de, fr, es, it, pt };

export function careerHistoryGuide(language) {
  return CAREER_HISTORY_GUIDE[languageCode(language)];
}
