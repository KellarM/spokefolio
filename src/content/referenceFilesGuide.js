// What every control on the Reference files page does, in the words the page
// itself uses. One file, six languages, so the guide and the screen are edited
// together rather than drifting apart.
//
// The final section carries a real limit: the tailoring prompt takes documents
// in a fixed order, so older files fall out of a build once the list is long.
// This is the only place a client would ever learn that.

const en = {
  title: 'How this page works',
  intro: 'Everything you add here becomes evidence when a résumé is tailored to a job.',
  sections: [
    {
      heading: 'Adding a file',
      items: [
        'Choose one or more files, or drag them onto the dashed box.',
        'PDF, Word, plain text or images all read fine.',
        'Pick what it is, so the studio knows how to use it.',
        'Add a note if the file needs explaining. Optional, but it helps.'
      ]
    },
    {
      heading: 'What it is',
      items: [
        'Previous résumé: an older CV to mine for detail.',
        'Project: a write-up of work you delivered.',
        'Praise: a reference, review or thank-you note.',
        'Certification: a licence, ticket or training certificate.',
        'Other: anything that does not fit the above.'
      ]
    },
    {
      heading: 'After you upload',
      items: [
        'The studio reads the file and stores what it found.',
        'Read means the text came through cleanly.',
        'Kept as reference means the file was stored but not readable: it still opens, but adds no wording.',
        'A résumé never waits on a file to finish reading.'
      ]
    },
    {
      heading: 'Each file row',
      items: [
        'Click the row to open it. Click again to close.',
        'The arrow opens the file itself in a new tab.',
        'What was read shows the studio reading, and it is editable if the file was misread.',
        'Delete removes the file and its reading. This cannot be undone.'
      ]
    },
    {
      heading: 'Where these files get used',
      items: [
        'Certifications and education are drawn from here as well as from your career history.',
        'The tailoring step uses up to twenty files, newest first.',
        'Anything beyond twenty is still stored and openable, but will not reach a résumé until older files are removed.'
      ]
    }
  ]
};

const de = {
  title: 'So funktioniert diese Seite',
  intro: 'Alles hier wird zum Beleg, wenn ein Lebenslauf auf eine Stelle zugeschnitten wird.',
  sections: [
    { heading: 'Datei hinzufügen', items: [
      'Wählen Sie eine oder mehrere Dateien, oder ziehen Sie sie in das Feld.',
      'PDF, Word, Text oder Bilder werden gelesen.',
      'Wählen Sie die Art, damit das Studio weiß, wofür sie gilt.',
      'Eine Notiz ist optional, hilft aber beim Einordnen.'
    ] },
    { heading: 'Art der Datei', items: [
      'Früherer Lebenslauf: ein älterer CV als Quelle für Details.',
      'Projekt: eine Beschreibung Ihrer Arbeit.',
      'Lob: Referenz, Beurteilung oder Dankesschreiben.',
      'Zertifikat: Lizenz, Nachweis oder Schulungsbescheinigung.',
      'Sonstiges: alles, was nicht darüber passt.'
    ] },
    { heading: 'Nach dem Hochladen', items: [
      'Das Studio liest die Datei und speichert das Ergebnis.',
      'Gelesen heißt: der Text kam sauber durch.',
      'Als Referenz behalten heißt: gespeichert, aber nicht lesbar. Sie öffnet sich weiterhin, liefert aber keinen Text.',
      'Ein Lebenslauf wartet nie auf eine Datei.'
    ] },
    { heading: 'Jede Dateizeile', items: [
      'Klicken öffnet die Zeile, erneut klicken schließt sie.',
      'Der Pfeil öffnet die Datei in einem neuen Tab.',
      'Gelesenes zeigt den Text und lässt sich korrigieren.',
      'Löschen entfernt Datei und Lesung. Nicht umkehrbar.'
    ] },
    { heading: 'Wo diese Dateien wirken', items: [
      'Zertifikate und Ausbildung stammen auch von hier.',
      'Das Zuschneiden nutzt bis zu zwanzig Dateien, die neuesten zuerst.',
      'Alles darüber hinaus bleibt gespeichert, erreicht aber keinen Lebenslauf, bis ältere Dateien entfernt sind.'
    ] }
  ]
};

const fr = {
  title: 'Comment fonctionne cette page',
  intro: 'Tout ce que vous ajoutez ici devient une preuve quand un CV est adapté à une offre.',
  sections: [
    { heading: 'Ajouter un fichier', items: [
      'Choisissez un ou plusieurs fichiers, ou déposez-les dans la zone.',
      'PDF, Word, texte ou images sont lus.',
      'Indiquez la nature du fichier pour que le studio sache l’utiliser.',
      'Une note est facultative, mais aide à situer le fichier.'
    ] },
    { heading: 'Nature du fichier', items: [
      'Ancien CV : un CV plus ancien où puiser des détails.',
      'Projet : un compte rendu de votre travail.',
      'Éloge : référence, évaluation ou remerciement.',
      'Certification : permis, attestation ou formation.',
      'Autre : tout ce qui ne rentre pas ailleurs.'
    ] },
    { heading: 'Après l’envoi', items: [
      'Le studio lit le fichier et conserve ce qu’il a trouvé.',
      'Lu signifie que le texte est passé correctement.',
      'Conservé comme référence : le fichier s’ouvre mais n’ajoute aucun texte.',
      'Un CV n’attend jamais la fin d’une lecture.'
    ] },
    { heading: 'Chaque ligne de fichier', items: [
      'Cliquez sur la ligne pour l’ouvrir, encore pour la fermer.',
      'La flèche ouvre le fichier dans un nouvel onglet.',
      'Ce qui a été lu s’affiche et reste modifiable.',
      'Supprimer retire le fichier et sa lecture. Irréversible.'
    ] },
    { heading: 'Où ces fichiers servent', items: [
      'Les certifications et la formation viennent aussi d’ici.',
      'L’adaptation utilise jusqu’à vingt fichiers, les plus récents d’abord.',
      'Au-delà de vingt, ils restent stockés mais n’atteignent plus un CV tant que des anciens ne sont pas retirés.'
    ] }
  ]
};

const es = {
  title: 'Cómo funciona esta página',
  intro: 'Todo lo que añadas aquí se convierte en evidencia cuando un CV se adapta a una oferta.',
  sections: [
    { heading: 'Añadir un archivo', items: [
      'Elige uno o varios archivos, o arrástralos al recuadro.',
      'PDF, Word, texto o imágenes se leen bien.',
      'Indica qué es, para que el estudio sepa cómo usarlo.',
      'Una nota es opcional, pero ayuda a situarlo.'
    ] },
    { heading: 'Qué es', items: [
      'CV anterior: un CV antiguo del que sacar detalle.',
      'Proyecto: una descripción del trabajo que hiciste.',
      'Elogio: referencia, evaluación o agradecimiento.',
      'Certificación: licencia, permiso o curso.',
      'Otro: lo que no encaja arriba.'
    ] },
    { heading: 'Después de subirlo', items: [
      'El estudio lee el archivo y guarda lo que encontró.',
      'Leído significa que el texto llegó limpio.',
      'Guardado como referencia: se abre, pero no aporta texto.',
      'Un CV nunca espera a que termine una lectura.'
    ] },
    { heading: 'Cada fila de archivo', items: [
      'Haz clic en la fila para abrirla; otra vez para cerrarla.',
      'La flecha abre el archivo en otra pestaña.',
      'Lo que se leyó se muestra y se puede corregir.',
      'Eliminar borra el archivo y su lectura. No se deshace.'
    ] },
    { heading: 'Dónde se usan', items: [
      'Las certificaciones y la formación también salen de aquí.',
      'La adaptación usa hasta veinte archivos, los más recientes primero.',
      'Lo que pase de veinte sigue guardado, pero no llegará a un CV hasta que quites archivos antiguos.'
    ] }
  ]
};

const it = {
  title: 'Come funziona questa pagina',
  intro: 'Tutto ciò che aggiungi qui diventa prova quando un CV viene adattato a un annuncio.',
  sections: [
    { heading: 'Aggiungere un file', items: [
      'Scegli uno o più file, oppure trascinali nel riquadro.',
      'PDF, Word, testo o immagini vengono letti.',
      'Indica di cosa si tratta, così lo studio sa come usarlo.',
      'Una nota è facoltativa, ma aiuta a collocarlo.'
    ] },
    { heading: 'Di cosa si tratta', items: [
      'CV precedente: un vecchio CV da cui ricavare dettagli.',
      'Progetto: una descrizione del lavoro svolto.',
      'Elogio: referenza, valutazione o ringraziamento.',
      'Certificazione: licenza, abilitazione o corso.',
      'Altro: ciò che non rientra sopra.'
    ] },
    { heading: 'Dopo il caricamento', items: [
      'Lo studio legge il file e conserva ciò che ha trovato.',
      'Letto significa che il testo è arrivato pulito.',
      'Conservato come riferimento: si apre, ma non aggiunge testo.',
      'Un CV non attende mai la fine di una lettura.'
    ] },
    { heading: 'Ogni riga di file', items: [
      'Clicca la riga per aprirla, di nuovo per chiuderla.',
      'La freccia apre il file in una nuova scheda.',
      'Ciò che è stato letto si vede e si può correggere.',
      'Elimina rimuove file e lettura. Non è reversibile.'
    ] },
    { heading: 'Dove vengono usati', items: [
      'Anche certificazioni e formazione arrivano da qui.',
      'L’adattamento usa fino a venti file, i più recenti per primi.',
      'Oltre venti restano archiviati, ma non raggiungono un CV finché non rimuovi file vecchi.'
    ] }
  ]
};

const pt = {
  title: 'Como esta página funciona',
  intro: 'Tudo o que adiciona aqui vira prova quando um currículo é adaptado a uma vaga.',
  sections: [
    { heading: 'Adicionar um ficheiro', items: [
      'Escolha um ou mais ficheiros, ou arraste-os para a caixa.',
      'PDF, Word, texto ou imagens são lidos.',
      'Indique o que é, para o estúdio saber como usar.',
      'Uma nota é opcional, mas ajuda a situar o ficheiro.'
    ] },
    { heading: 'O que é', items: [
      'Currículo anterior: um CV antigo de onde retirar detalhe.',
      'Projeto: uma descrição do trabalho que fez.',
      'Elogio: referência, avaliação ou agradecimento.',
      'Certificação: licença, curso ou certificado.',
      'Outro: o que não encaixa acima.'
    ] },
    { heading: 'Depois de carregar', items: [
      'O estúdio lê o ficheiro e guarda o que encontrou.',
      'Lido significa que o texto passou limpo.',
      'Guardado como referência: abre, mas não acrescenta texto.',
      'Um currículo nunca espera que a leitura termine.'
    ] },
    { heading: 'Cada linha de ficheiro', items: [
      'Clique na linha para abrir; outra vez para fechar.',
      'A seta abre o ficheiro num novo separador.',
      'O que foi lido aparece e pode ser corrigido.',
      'Eliminar remove o ficheiro e a leitura. Não é reversível.'
    ] },
    { heading: 'Onde estes ficheiros entram', items: [
      'Certificações e formação também vêm daqui.',
      'A adaptação usa até vinte ficheiros, os mais recentes primeiro.',
      'Acima de vinte ficam guardados, mas não chegam a um currículo até remover ficheiros antigos.'
    ] }
  ]
};

export const REFERENCE_FILES_GUIDE = { en, de, fr, es, it, pt };

// The studio stores the language by name ("German"), not by code.
const BY_NAME = {
  english: 'en',
  german: 'de',
  deutsch: 'de',
  french: 'fr',
  français: 'fr',
  spanish: 'es',
  español: 'es',
  italian: 'it',
  italiano: 'it',
  portuguese: 'pt',
  português: 'pt'
};

export function referenceFilesGuide(language) {
  const code = BY_NAME[String(language || '').toLowerCase()] || 'en';
  return REFERENCE_FILES_GUIDE[code];
}
