import { languageCode } from './languageCode';

// What every control on Applications does, taken from the page and its detail
// view: the filter row, the statuses, and the fact that each status move is
// written to a history line rather than overwriting the last one.

const en = {
  title: 'How this page works',
  intro: 'Every tailored résumé becomes an application, and every status move is kept.',
  sections: [
    { heading: 'What an application is', items: [
      'An application is created when you tailor a résumé to a posting.',
      'It holds that résumé, its cover letter and the posting it answered.',
      'Nothing here is sent for you. You apply, then record it.'
    ] },
    { heading: 'The statuses', items: [
      'Draft: started, not finished.',
      'Ready to send: written, waiting on you.',
      'Not applied: a résumé exists but you have not applied.',
      'Applied: you sent it.',
      'Contacted, Interviewing, Offer: what came back.',
      'The row of counts filters the list. It never hides applications, only narrows the view.'
    ] },
    { heading: 'Moving a status', items: [
      'Each change is written to a history line with its own timestamp.',
      'Earlier statuses stay visible, so a stalled application looks stalled rather than vanished.',
      'Marking applied is the moment the follow-up clock starts.'
    ] },
    { heading: 'Inside an application', items: [
      'The résumé and cover letter that were built for this posting.',
      'The posting itself, with the company brief drawn from it.',
      'Answer workshop for the questions an employer is likely to ask.',
      'Interview panel and calendar once a date exists.',
      'Résumé runs, so you can see each version made for this job.'
    ] },
    { heading: 'Deleting', items: [
      'Deleting an application removes it from the list.',
      'Deleting a single run removes one version and leaves the application.',
      'Status history is written separately, so the record of what happened outlives a deleted application.'
    ] },
    { heading: 'Where the words come from', items: [
      'Career history and reference files only. The posting shapes the emphasis, not the facts.',
      'If a résumé reads thin, the history is thin for that job, not the writing.'
    ] }
  ]
};

const de = {
  title: 'So funktioniert diese Seite',
  intro: 'Jeder zugeschnittene Lebenslauf wird eine Bewerbung, und jeder Statuswechsel bleibt erhalten.',
  sections: [
    { heading: 'Was eine Bewerbung ist', items: [
      'Eine Bewerbung entsteht beim Zuschneiden eines Lebenslaufs auf eine Anzeige.',
      'Sie enthält Lebenslauf, Anschreiben und die Anzeige, auf die geantwortet wurde.',
      'Nichts wird für Sie versendet. Sie bewerben sich, dann tragen Sie es ein.'
    ] },
    { heading: 'Die Status', items: [
      'Entwurf: begonnen, nicht fertig.',
      'Sendebereit: geschrieben, wartet auf Sie.',
      'Nicht beworben: Lebenslauf existiert, Bewerbung nicht.',
      'Beworben: abgeschickt.',
      'Kontaktiert, Gespräch, Angebot: was zurückkam.',
      'Die Zähler filtern die Liste, sie verstecken nichts.'
    ] },
    { heading: 'Status ändern', items: [
      'Jeder Wechsel wird mit Zeitstempel als Verlaufszeile geschrieben.',
      'Frühere Status bleiben sichtbar, eine stockende Bewerbung sieht stockend aus.',
      'Mit „beworben“ beginnt die Nachfasszeit.'
    ] },
    { heading: 'In einer Bewerbung', items: [
      'Der Lebenslauf und das Anschreiben für diese Anzeige.',
      'Die Anzeige selbst, mit Kurzprofil des Unternehmens.',
      'Antwortwerkstatt für wahrscheinliche Fragen.',
      'Gesprächsbereich und Kalender, sobald ein Termin steht.',
      'Lebenslauf-Läufe, also jede Version für diese Stelle.'
    ] },
    { heading: 'Löschen', items: [
      'Eine Bewerbung löschen entfernt sie aus der Liste.',
      'Einen Lauf löschen entfernt eine Version, die Bewerbung bleibt.',
      'Der Statusverlauf wird getrennt geschrieben und überlebt eine gelöschte Bewerbung.'
    ] },
    { heading: 'Woher die Worte kommen', items: [
      'Nur aus Verlauf und Referenzdateien. Die Anzeige setzt Schwerpunkte, keine Fakten.',
      'Wirkt ein Lebenslauf dünn, ist der Verlauf für diese Stelle dünn, nicht der Text.'
    ] }
  ]
};

const fr = {
  title: 'Comment fonctionne cette page',
  intro: 'Chaque CV adapté devient une candidature, et chaque changement de statut est conservé.',
  sections: [
    { heading: 'Ce qu’est une candidature', items: [
      'Une candidature naît quand vous adaptez un CV à une offre.',
      'Elle contient ce CV, sa lettre et l’offre à laquelle il répond.',
      'Rien n’est envoyé à votre place. Vous postulez, puis vous l’enregistrez.'
    ] },
    { heading: 'Les statuts', items: [
      'Brouillon : commencé, pas terminé.',
      'Prêt à envoyer : écrit, en attente de vous.',
      'Non postulé : un CV existe, pas la candidature.',
      'Postulé : envoyé.',
      'Contacté, Entretien, Offre : ce qui est revenu.',
      'Les compteurs filtrent la liste, ils ne cachent rien.'
    ] },
    { heading: 'Changer un statut', items: [
      'Chaque changement est écrit avec son horodatage.',
      'Les statuts précédents restent visibles : une candidature qui stagne se voit.',
      'Marquer postulé lance le délai de relance.'
    ] },
    { heading: 'Dans une candidature', items: [
      'Le CV et la lettre construits pour cette offre.',
      'L’offre elle-même, avec un résumé de l’entreprise.',
      'Atelier de réponses aux questions probables.',
      'Entretien et calendrier dès qu’une date existe.',
      'Les versions du CV produites pour ce poste.'
    ] },
    { heading: 'Supprimer', items: [
      'Supprimer une candidature la retire de la liste.',
      'Supprimer une version retire une version, la candidature reste.',
      'L’historique des statuts est écrit à part et survit à la suppression.'
    ] },
    { heading: 'D’où viennent les mots', items: [
      'Du parcours et des fichiers de référence seulement. L’offre change l’accent, pas les faits.',
      'Un CV qui semble mince signale un parcours mince pour ce poste, pas une écriture faible.'
    ] }
  ]
};

const es = {
  title: 'Cómo funciona esta página',
  intro: 'Cada CV adaptado se convierte en candidatura, y cada cambio de estado queda guardado.',
  sections: [
    { heading: 'Qué es una candidatura', items: [
      'Se crea al adaptar un CV a una oferta.',
      'Guarda ese CV, su carta y la oferta que respondió.',
      'Nada se envía por ti. Tú postulas y luego lo registras.'
    ] },
    { heading: 'Los estados', items: [
      'Borrador: empezado, sin terminar.',
      'Listo para enviar: escrito, esperándote.',
      'Sin postular: hay CV, no candidatura.',
      'Postulado: enviado.',
      'Contactado, Entrevista, Oferta: lo que volvió.',
      'Los contadores filtran la lista, no esconden nada.'
    ] },
    { heading: 'Cambiar un estado', items: [
      'Cada cambio se escribe con su fecha y hora.',
      'Los estados anteriores siguen visibles: una candidatura parada se ve parada.',
      'Marcar postulado arranca el reloj de seguimiento.'
    ] },
    { heading: 'Dentro de una candidatura', items: [
      'El CV y la carta hechos para esta oferta.',
      'La oferta, con un resumen de la empresa.',
      'Taller de respuestas para las preguntas probables.',
      'Entrevista y calendario cuando hay fecha.',
      'Las versiones del CV hechas para este puesto.'
    ] },
    { heading: 'Eliminar', items: [
      'Eliminar una candidatura la quita de la lista.',
      'Eliminar una versión quita una versión y deja la candidatura.',
      'El historial de estados se escribe aparte y sobrevive al borrado.'
    ] },
    { heading: 'De dónde salen las palabras', items: [
      'Solo del historial y tus archivos. La oferta cambia el énfasis, no los hechos.',
      'Un CV flojo indica historial flojo para ese puesto, no mala redacción.'
    ] }
  ]
};

const it = {
  title: 'Come funziona questa pagina',
  intro: 'Ogni CV adattato diventa una candidatura, e ogni cambio di stato resta.',
  sections: [
    { heading: 'Cos’è una candidatura', items: [
      'Nasce quando adatti un CV a un annuncio.',
      'Contiene quel CV, la lettera e l’annuncio a cui risponde.',
      'Nulla viene inviato al posto tuo. Ti candidi, poi lo registri.'
    ] },
    { heading: 'Gli stati', items: [
      'Bozza: iniziata, non finita.',
      'Pronto: scritto, in attesa di te.',
      'Non candidato: c’è il CV, non la candidatura.',
      'Candidato: inviata.',
      'Contattato, Colloquio, Offerta: cosa è tornato.',
      'I contatori filtrano la lista, non nascondono nulla.'
    ] },
    { heading: 'Cambiare stato', items: [
      'Ogni cambio viene scritto con data e ora.',
      'Gli stati precedenti restano visibili: una candidatura ferma si vede.',
      'Segnare candidato avvia il conteggio del seguito.'
    ] },
    { heading: 'Dentro una candidatura', items: [
      'Il CV e la lettera costruiti per questo annuncio.',
      'L’annuncio stesso, con la sintesi dell’azienda.',
      'Officina risposte per le domande probabili.',
      'Colloquio e calendario quando c’è una data.',
      'Le versioni del CV fatte per questo ruolo.'
    ] },
    { heading: 'Eliminare', items: [
      'Eliminare una candidatura la toglie dalla lista.',
      'Eliminare una versione toglie una versione, la candidatura resta.',
      'La cronologia degli stati è scritta a parte e sopravvive alla cancellazione.'
    ] },
    { heading: 'Da dove vengono le parole', items: [
      'Solo dalla storia e dai tuoi file. L’annuncio cambia l’enfasi, non i fatti.',
      'Un CV scarno segnala una storia scarna per quel ruolo, non una scrittura debole.'
    ] }
  ]
};

const pt = {
  title: 'Como esta página funciona',
  intro: 'Cada currículo adaptado torna-se uma candidatura, e cada mudança de estado fica guardada.',
  sections: [
    { heading: 'O que é uma candidatura', items: [
      'É criada quando adapta um currículo a uma vaga.',
      'Guarda esse currículo, a carta e a vaga a que respondeu.',
      'Nada é enviado por si. Candidata-se e depois registra.'
    ] },
    { heading: 'Os estados', items: [
      'Rascunho: começado, não terminado.',
      'Pronto a enviar: escrito, à sua espera.',
      'Não candidatado: há currículo, não candidatura.',
      'Candidatado: enviado.',
      'Contactado, Entrevista, Oferta: o que voltou.',
      'Os contadores filtram a lista, não escondem nada.'
    ] },
    { heading: 'Mudar um estado', items: [
      'Cada mudança é escrita com data e hora.',
      'Os estados anteriores continuam visíveis: uma candidatura parada vê-se.',
      'Marcar como candidatado inicia o prazo de seguimento.'
    ] },
    { heading: 'Dentro de uma candidatura', items: [
      'O currículo e a carta feitos para esta vaga.',
      'A vaga, com resumo da empresa.',
      'Oficina de respostas para as perguntas prováveis.',
      'Entrevista e calendário quando há data.',
      'As versões do currículo feitas para este cargo.'
    ] },
    { heading: 'Eliminar', items: [
      'Eliminar uma candidatura retira-a da lista.',
      'Eliminar uma versão retira uma versão e mantém a candidatura.',
      'O histórico de estados é escrito à parte e sobrevive ao apagar.'
    ] },
    { heading: 'De onde vêm as palavras', items: [
      'Apenas do histórico e dos seus ficheiros. A vaga muda a ênfase, nunca os factos.',
      'Um currículo escasso indica histórico escasso para esse cargo, não escrita fraca.'
    ] }
  ]
};

export const APPLICATIONS_GUIDE = { en, de, fr, es, it, pt };

export function applicationsGuide(language) {
  return APPLICATIONS_GUIDE[languageCode(language)];
}
