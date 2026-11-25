// Where a posting was found, named the way the client names it. The application
// only ever stores the employer's or board's link, so the site has to be read back
// from that address: "indeed" is a name people recognise, the raw address is not.
const KNOWN_SITES = [
  [/jobbank\.gc\.ca/i, 'Job Bank'],
  [/indeed\./i, 'Indeed'],
  [/glassdoor\./i, 'Glassdoor'],
  [/linkedin\./i, 'LinkedIn'],
  [/simplyhired\./i, 'SimplyHired'],
  [/ziprecruiter\./i, 'ZipRecruiter'],
  [/monster\./i, 'Monster'],
  [/workopolis\./i, 'Workopolis'],
  [/eluta\./i, 'Eluta'],
  [/careerjet\./i, 'Careerjet'],
  [/emploive\./i, 'Emploi VE'],
  [/jobillico\./i, 'Jobillico'],
  [/talent\.com/i, 'Talent.com'],
  [/workbc\./i, 'WorkBC'],
  [/jobbank\.ca/i, 'Job Bank'],
  [/careerbuilder\./i, 'CareerBuilder'],
  [/dice\.com/i, 'Dice'],
  [/upwork\./i, 'Upwork'],
  [/kijiji\./i, 'Kijiji']
];

// The site's name for a posting link, or '' when there is no usable link.
export default function postingSource(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  let host = '';
  try {
    host = new URL(raw).hostname.replace(/^www\./i, '');
  } catch (error) {
    return '';
  }
  const known = KNOWN_SITES.find(([pattern]) => pattern.test(host));
  if (known) return known[1];
  // A link that is not a board is the employer's own posting page.
  if (/^(careers?|jobs?|emploi|apply)\./i.test(host) || /\.(careers?|jobs?)\./i.test(host)) {
    const employer = host.replace(/^(careers?|jobs?|emploi|apply)\./i, '').split('.')[0];
    return employer ? `${employer.charAt(0).toUpperCase()}${employer.slice(1)} careers` : 'Employer site';
  }
  return host;
}