import { languageCode } from './languageCode.js';

// What every control on Interview does. The page is a picker plus the drill that
// used to sit inside an application, so the guide has to carry both: how a
// company gets chosen, where the company brief comes from, and what the
// interviewer is and is not allowed to know.

const en = {
  title: 'How this page works',
  intro: 'One company at a time, and the interviewer is that company’s HR.',
  sections: [
    { heading: 'Choosing the company', items: [
      'The list holds every application in your profile, newest first.',
      'Choose the company from the list at the top. Pick the one you are actually meeting.',
      'Practice interview with this company on an application opens that same company here.',
      'Choosing costs nothing: no message reaches the employer.'
    ] },
    { heading: 'The company brief', items: [
      'The app reads the company’s public record: what it does, how long it has traded, its size, who runs it.',
      'It is read once and kept with the application, so returning to a company does not repeat the lookup.',
      'Try again re-runs a lookup that failed. The drill still runs from the posting alone either way.',
      'Where the public record is thin, the interviewer says nothing rather than guessing.'
    ] },
    { heading: 'The interviewer', items: [
      'It plays that company’s HR for the role you applied to.',
      'It works only from the posting, the résumé you sent and the brief.',
      'Your wider career history is background for the interviewer, never something the room expects you to have said.'
    ] },
    { heading: 'Answering', items: [
      'Answers can be typed or spoken with the microphone.',
      'Each answer is graded in the moment: what landed, what to improve.',
      'Voice mode reads the question aloud and speaks the feedback, so a drill can run hands-free.',
      'Answer workshop shows two worked answers per question when you want a model first.'
    ] },
    { heading: 'What is kept', items: [
      'Every drill is stored on the application, so it survives a refresh and stays with the job.',
      'The five most recent sessions are kept per application.',
      'A finished drill produces a readiness report you can reread before the real meeting.',
      'Deleting a session deletes that one session only.'
    ] }
  ]
};

const de = {
  title: 'So funktioniert diese Seite',
  intro: 'Ein Unternehmen nach dem anderen, und der Interviewer ist dessen Personalabteilung.',
  sections: [
    { heading: 'Unternehmen wählen', items: [
      'Die Liste enthält alle Bewerbungen in Ihrem Profil, die neueste zuerst.',
      'Unternehmen wählen Sie oben in der Liste. Nehmen Sie das, bei dem Sie wirklich antreten.',
      '„Gespräch mit diesem Unternehmen üben“ in einer Bewerbung öffnet genau dieses Unternehmen hier.',
      'Die Auswahl kostet nichts: Beim Arbeitgeber kommt keine Nachricht an.'
    ] },
    { heading: 'Das Unternehmensprofil', items: [
      'Die App liest den öffentlichen Auftritt: was das Unternehmen tut, wie lange es besteht, Größe und Leitung.',
      'Es wird einmal gelesen und bei der Bewerbung behalten, eine Rückkehr wiederholt die Suche nicht.',
      '„Erneut versuchen“ wiederholt eine fehlgeschlagene Suche. Die Übung läuft so oder so aus der Anzeige.',
      'Wo die öffentliche Spur dünn ist, sagt der Interviewer nichts, statt zu raten.'
    ] },
    { heading: 'Der Interviewer', items: [
      'Er spielt die Personalabteilung dieses Unternehmens für die Stelle, auf die Sie sich beworben haben.',
      'Er arbeitet nur mit der Anzeige, dem gesendeten Lebenslauf und dem Profil.',
      'Ihr übriger Verlauf ist Hintergrund für den Interviewer, nie etwas, das der Raum von Ihnen erwartet.'
    ] },
    { heading: 'Antworten', items: [
      'Antworten tippen Sie oder sprechen sie über das Mikrofon.',
      'Jede Antwort wird sofort bewertet: was getragen hat, was besser geht.',
      'Der Sprachmodus liest die Frage vor und spricht die Rückmeldung, die Übung läuft freihändig.',
      'Die Antwortwerkstatt zeigt zwei ausgearbeitete Antworten pro Frage, wenn Sie erst ein Vorbild wollen.'
    ] },
    { heading: 'Was erhalten bleibt', items: [
      'Jede Übung liegt bei der Bewerbung, übersteht ein Neuladen und bleibt bei der Stelle.',
      'Die fünf letzten Sitzungen bleiben je Bewerbung erhalten.',
      'Eine beendete Übung erzeugt einen Bereitschaftsbericht, den Sie vor dem echten Termin nachlesen können.',
      'Eine Sitzung löschen löscht nur diese eine Sitzung.'
    ] }
  ]
};

const fr = {
  title: 'Comment fonctionne cette page',
  intro: 'Une entreprise à la fois, et l’intervieweur est les RH de cette entreprise.',
  sections: [
    { heading: 'Choisir l’entreprise', items: [
      'La liste contient toutes les candidatures de votre profil, la plus récente en premier.',
      'Choisissez l’entreprise dans la liste en haut. Prenez celle que vous rencontrez vraiment.',
      '« Faire un entretien avec cette entreprise » depuis une candidature ouvre la même entreprise ici.',
      'Choisir ne coûte rien : aucun message n’atteint l’employeur.'
    ] },
    { heading: 'Le profil de l’entreprise', items: [
      'L’app lit la trace publique : ce que fait l’entreprise, depuis quand, sa taille, qui la dirige.',
      'Elle est lue une fois et gardée avec la candidature, revenir ne relance pas la recherche.',
      '« Réessayer » relance une recherche échouée. L’exercice fonctionne de toute façon à partir de l’offre.',
      'Là où la trace publique est mince, l’intervieweur se taît plutôt que de deviner.'
    ] },
    { heading: 'L’intervieweur', items: [
      'Il joue les RH de cette entreprise pour le poste visé.',
      'Il travaille uniquement à partir de l’offre, du CV envoyé et du profil.',
      'Le reste de votre parcours est un contexte pour lui, jamais quelque chose que la salle attend de vous.'
    ] },
    { heading: 'Répondre', items: [
      'Les réponses se tapent ou se disent au microphone.',
      'Chaque réponse est évaluée sur le moment : ce qui a porté, ce qu’il faut améliorer.',
      'Le mode vocal lit la question et dit la remarque, l’exercice se fait sans les mains.',
      'L’atelier de réponses montre deux réponses travaillées par question si vous voulez d’abord un modèle.'
    ] },
    { heading: 'Ce qui est conservé', items: [
      'Chaque exercice est stocké sur la candidature : il survit à un rechargement et reste avec le poste.',
      'Les cinq dernières sessions sont gardées par candidature.',
      'Un exercice terminé produit un bilan de préparation à relire avant le vrai rendez-vous.',
      'Supprimer une session ne supprime que cette session.'
    ] }
  ]
};

const es = {
  title: 'Cómo funciona esta página',
  intro: 'Una empresa cada vez, y el entrevistador es el personal de esa empresa.',
  sections: [
    { heading: 'Elegir la empresa', items: [
      'La lista contiene todas las candidaturas de su perfil, la más reciente primero.',
      'Elija la empresa en la lista de arriba. Tome la que realmente va a ver.',
      '«Practicar la entrevista con esta empresa» desde una candidatura abre esa misma empresa aquí.',
      'Elegir no cuesta nada: no llega ningún mensaje al empleador.'
    ] },
    { heading: 'El perfil de la empresa', items: [
      'La app lee el rastro público: a qué se dedica, desde cuándo, su tamaño y quién la dirige.',
      'Se lee una vez y se guarda con la candidatura, volver no repite la búsqueda.',
      '«Intentar de nuevo» repite una búsqueda fallida. El ensayo funciona igual desde la oferta.',
      'Donde el rastro público es escaso, el entrevistador calla en vez de adivinar.'
    ] },
    { heading: 'El entrevistador', items: [
      'Hace de personal de esa empresa para el puesto al que se postuló.',
      'Trabaja solo con la oferta, el currículum enviado y el perfil.',
      'El resto de su trayectoria es contexto para él, nunca algo que la sala espere que usted haya dicho.'
    ] },
    { heading: 'Responder', items: [
      'Las respuestas se escriben o se dicen por el micrófono.',
      'Cada respuesta se evalúa al momento: qué funcionó, qué mejorar.',
      'El modo de voz lee la pregunta y dice la devolución, el ensayo se hace sin manos.',
      'El taller de respuestas muestra dos respuestas trabajadas por pregunta si quiere antes un modelo.'
    ] },
    { heading: 'Qué se conserva', items: [
      'Cada ensayo se guarda en la candidatura: sobrevive a una recarga y queda con el puesto.',
      'Se conservan las cinco sesiones más recientes por candidatura.',
      'Un ensayo terminado produce un informe de preparación para releer antes de la cita real.',
      'Borrar una sesión borra solo esa sesión.'
    ] }
  ]
};

const it = {
  title: 'Come funziona questa pagina',
  intro: 'Un’azienda alla volta, e l’intervistatore sono le risorse umane di quell’azienda.',
  sections: [
    { heading: 'Scegliere l’azienda', items: [
      'L’elenco contiene tutte le candidature del suo profilo, la più recente per prima.',
      'Scelga l’azienda nell’elenco in alto. Prenda quella che incontrerà davvero.',
      '«Prova il colloquio con questa azienda» da una candidatura apre la stessa azienda qui.',
      'Scegliere non costa nulla: nessun messaggio raggiunge il datore di lavoro.'
    ] },
    { heading: 'Il profilo dell’azienda', items: [
      'L’app legge la traccia pubblica: cosa fa, da quanto tempo, la dimensione, chi la guida.',
      'Viene letta una volta e tenuta con la candidatura, tornare non ripete la ricerca.',
      '«Riprova» ripete una ricerca fallita. La prova funziona comunque, dall’annuncio.',
      'Dove la traccia pubblica è scarsa, l’intervistatore tace invece di indovinare.'
    ] },
    { heading: 'L’intervistatore', items: [
      'Interpreta le risorse umane di quell’azienda per il ruolo a cui si è candidato.',
      'Lavora solo dall’annuncio, dal curriculum inviato e dal profilo.',
      'Il resto del suo percorso è contesto per lui, mai qualcosa che la stanza si aspetta da lei.'
    ] },
    { heading: 'Rispondere', items: [
      'Le risposte si scrivono o si dicono al microfono.',
      'Ogni risposta è valutata sul momento: cosa ha funzionato, cosa migliorare.',
      'La modalità vocale legge la domanda e dice il commento, la prova si fa senza mani.',
      'L’officina delle risposte mostra due risposte svolte per domanda se vuole prima un modello.'
    ] },
    { heading: 'Cosa resta', items: [
      'Ogni prova è salvata sulla candidatura: sopravvive a un ricaricamento e resta con il posto.',
      'Le cinque sessioni più recenti restano per candidatura.',
      'Una prova conclusa produce un rapporto di preparazione da rileggere prima del colloquio vero.',
      'Eliminare una sessione elimina solo quella sessione.'
    ] }
  ]
};

const pt = {
  title: 'Como funciona esta página',
  intro: 'Uma empresa de cada vez, e o entrevistador é os recursos humanos dessa empresa.',
  sections: [
    { heading: 'Escolher a empresa', items: [
      'A lista tem todas as candidaturas do seu perfil, a mais recente primeiro.',
      'Escolha a empresa na lista em cima. Pegue naquela que vai encontrar mesmo.',
      '«Praticar a entrevista com esta empresa» numa candidatura abre essa mesma empresa aqui.',
      'Escolher não custa nada: nenhuma mensagem chega ao empregador.'
    ] },
    { heading: 'O perfil da empresa', items: [
      'A app lê o rasto público: o que faz, há quanto tempo, o tamanho e quem a dirige.',
      'É lido uma vez e guardado com a candidatura, voltar não repete a procura.',
      '«Tentar novamente» repete uma procura falhada. O ensaio funciona de qualquer forma, a partir do anúncio.',
      'Onde o rasto público é escasso, o entrevistador cala-se em vez de adivinhar.'
    ] },
    { heading: 'O entrevistador', items: [
      'Faz o papel dos recursos humanos dessa empresa para o cargo a que se candidatou.',
      'Trabalha apenas a partir do anúncio, do currículo enviado e do perfil.',
      'O resto do seu percurso é contexto para ele, nunca algo que a sala espere que tenha dito.'
    ] },
    { heading: 'Responder', items: [
      'As respostas escrevem-se ou dizem-se pelo microfone.',
      'Cada resposta é avaliada no momento: o que pegou, o que melhorar.',
      'O modo de voz lê a pergunta e diz o comentário, o ensaio corre sem mãos.',
      'A oficina de respostas mostra duas respostas trabalhadas por pergunta se quiser primeiro um modelo.'
    ] },
    { heading: 'O que fica', items: [
      'Cada ensaio fica guardado na candidatura: sobrevive a um recarregamento e fica com o cargo.',
      'As cinco sessões mais recentes ficam por candidatura.',
      'Um ensaio terminado produz um relatório de preparação para reler antes da marcação real.',
      'Apagar uma sessão apaga apenas essa sessão.'
    ] }
  ]
};

export const INTERVIEW_GUIDE = { en, de, fr, es, it, pt };

export function interviewGuide(language) {
  return INTERVIEW_GUIDE[languageCode(language)];
}
