// Deep links for the board directory Open buttons: the boards that accept
// a search in the URL, so the person lands on the board with the job and
// place from their last Spokefolio search already typed in. They hit enter
// and search as themselves - a plain link, no scraping, no automation, just
// the board's own search page with the fields filled.

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

const enc = (value) => encodeURIComponent(String(value || '').trim());

export const boardSearchUrl = (board, category, place) => {
  const q = enc(category);
  const loc = enc(place);
  if (!q && !loc) return board.url;
  const host = hostOf(board.url);
  const both = (q, l) => (q ? (l ? `${q}&${l}` : q) : l);
  if (host.endsWith('jobbank.gc.ca')) {
    return `${board.url}?${both(q && `searchstring=${q}`, loc && `locationstring=${loc}`)}`;
  }
  if (host === 'ca.indeed.com' || host === 'indeed.com' || host.endsWith('.indeed.com')) {
    return `https://${host}/jobs?${both(q && `q=${q}`, loc && `l=${loc}`)}`;
  }
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    return `https://www.linkedin.com/jobs/search?${both(q && `keywords=${q}`, loc && `location=${loc}`)}`;
  }
  if (host === 'glassdoor.ca' || host === 'glassdoor.com' || host.endsWith('.glassdoor.com') || host.endsWith('.glassdoor.ca')) {
    return q ? `https://${host}/Job/jobs.htm?sc=${q}` : board.url;
  }
  if (host === 'ziprecruiter.ca' || host === 'ziprecruiter.com' || host.endsWith('.ziprecruiter.com') || host.endsWith('.ziprecruiter.ca')) {
    return `https://${host}/jobs-search?${both(q && `search=${q}`, loc && `location=${loc}`)}`;
  }
  if (host === 'eluta.ca' || host.endsWith('.eluta.ca')) {
    return `https://www.eluta.ca/search?${both(q && `q=${q}`, loc && `l=${loc}`)}`;
  }
  if (host === 'monster.com' || host.endsWith('.monster.com')) {
    return `https://www.monster.com/jobs/search?${both(q && `q=${q}`, loc && `where=${loc}`)}`;
  }
  if (host === 'careerbuilder.com' || host.endsWith('.careerbuilder.com')) {
    return `https://www.careerbuilder.com/jobs?${both(q && `keywords=${q}`, loc && `location=${loc}`)}`;
  }
  if (host === 'usajobs.gov' || host.endsWith('.usajobs.gov')) {
    return `https://www.usajobs.gov/Search/Results?${both(q && `q=${q}`, loc && `l=${loc}`)}`;
  }
  return board.url;
};

