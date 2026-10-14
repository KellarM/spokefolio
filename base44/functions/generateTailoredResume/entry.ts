import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildExperience, cleanList, cleanText, compactEntries } from '../../shared/career.ts';
import { fitResumeToPages } from '../../shared/resumeFit.ts';
import { applyExperienceOrder } from '../../shared/experienceOrder.ts';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    posting_priorities: { type: 'array', items: { type: 'string' } },
    headline: { type: 'string' },
    summary: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'integer' },
          title: { type: 'string' },
          dates: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } }
        },
        required: ['ref', 'bullets']
      }
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          degree: { type: 'string' },
          institution: { type: 'string' },
          dates: { type: 'string' },
          detail: { type: 'string' }
        }
      }
    },
    certifications: { type: 'array', items: { type: 'string' } },
    cover_letter: { type: 'array', items: { type: 'string' } },
    match_summary: { type: 'string' },
    gaps: { type: 'array', items: { type: 'string' } }
  },
  required: ['posting_priorities', 'headline', 'summary', 'skills', 'keywords', 'experience', 'cover_letter', 'match_summary', 'gaps']
};

// The second pass, used only when the first draft comes back short of two full pages.
const EXPANSION_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
    keywords: { type: 'array', items: { type: 'string' } },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'integer' },
          bullets: { type: 'array', items: { type: 'string' } }
        },
        required: ['ref', 'bullets']
      }
    }
  },
  required: ['summary', 'experience']
};

// Visible words across the resume body: what actually fills the two pages.
const WORD_FLOOR = 560;

const countWords = (value) => (typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean).length : 0);

function visibleWordCount(resume) {
  let total = countWords(resume.headline) + countWords(resume.summary);
  for (const job of Array.isArray(resume.experience) ? resume.experience : []) {
    for (const bullet of Array.isArray(job?.bullets) ? job.bullets : []) total += countWords(bullet);
  }
  for (const list of [resume.skills, resume.certifications, resume.keywords]) {
    for (const item of Array.isArray(list) ? list : []) total += countWords(item);
  }
  return total;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const jobDescription = cleanText(body?.job_description, 20000);
    const company = cleanText(body?.company, 160);
    const jobTitle = cleanText(body?.job_title, 160);
    const template = cleanText(body?.template, 60);
    const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};
    const entries = compactEntries(body?.entries, 70000);
    const documents = (Array.isArray(body?.documents) ? body.documents : []).slice(0, 20).map((doc) => ({
      name: cleanText(doc?.name, 160),
      type: cleanText(doc?.doc_type, 40),
      summary: cleanText(doc?.extracted_summary, 2500)
    }));

    if (jobDescription.length < 40) {
      return Response.json({ error: 'Paste a longer job description so the match is useful.' }, { status: 400 });
    }
    if (!entries.length) {
      return Response.json({ error: 'Add your career history first, then tailor a resume.' }, { status: 400 });
    }

    const prompt = `You are an expert resume writer preparing a tailored, ATS-friendly resume for one specific job posting.

TARGET ROLE
Job title: ${jobTitle || '(not given)'}
Company: ${company || '(not given)'}

JOB POSTING
"""
${jobDescription}
"""

CANDIDATE CONTACT DETAILS
${JSON.stringify({ name: cleanText(profile.full_name, 120), headline: cleanText(profile.headline, 200), location: cleanText(profile.location, 120), summary_of_history: cleanText(profile.master_summary, 2000), core_skills: cleanList(profile.core_skills, 25, 80), target_titles: cleanList(profile.target_titles, 8, 120) }, null, 2)}

CANDIDATE'S REAL CAREER HISTORY (the only source of truth)
${JSON.stringify(entries, null, 2)}

REFERENCE MATERIAL FROM THEIR OWN DOCUMENTS
${JSON.stringify(documents, null, 2)}

HOW TO WRITE IT
- Truthfulness is absolute: never invent employers, job titles, dates, degrees, certifications, tools or numbers. Everything must trace back to the history or reference material above.
- LENGTH IS A REQUIREMENT: this resume prints as TWO FULL PAGES, with page two at least 80 percent full and nothing spilling onto a third. Budget the visible words: 600-680 in total - roughly 120-160 for the headline and summary, 400-460 across all the role bullets, and about 80 for the full skills, certifications and keywords lists. Under about 560 and page two looks half empty; above about 700 and it spills onto a third page. Both are failures. Reach the target with real detail the history already holds (metrics, tools, volumes, methods, outcomes, the candidate's own original_notes) written out in full sentences - never with invented facts, restated bullets or filler adjectives. Two bullets may overlap only when a posting priority genuinely needs both angles. That bullet budget governs every count below: a long history means fewer bullets per role (never below 2) so the total still lands inside the budget, and a short one means each role carries as many bullets as its real evidence supports. Never leave a job out to save room, and when the history genuinely holds less than two pages of material, return everything it has and stop: an honest shorter resume beats an invented longer one.
- Rewrite, reorder and re-emphasise freely: echo the posting's own vocabulary, seniority and priorities wherever the real history genuinely matches.
- The tailoring must be visible on the page. Someone reading this resume next to the posting should see the posting mirrored back: its role title in the headline, its single most important priority in the first sentence of the summary, and its own terms for the tools, processes, shift patterns, equipment and metrics inside the bullets of the roles that matter most. Never reuse wording that would fit any employer: choose and phrase every bullet for THIS posting.
- posting_priorities: FIRST, read the posting and list its 6-10 most important requirements in order of importance (duties, tools, systems, equipment, shift pattern, certifications, safety or quality demands, and the soft skills it stresses). This list drives every choice below: the headline, the summary, the skills, and which evidence goes into each job's bullets.
- headline: a short job-targeted positioning line (the target title plus the two or three strengths that matter most for this posting).
- summary: 4-6 sentences (roughly 120-160 words) of targeted positioning that names the target role, mirrors the posting's language and leads with the strongest matching evidence; then work through the remaining posting_priorities with the candidate's real evidence instead of compressing it. No first-person pronouns, no clichés, no sentence that would fit another employer.
- skills: 16-22 skills ordered by relevance to this posting, using the posting's wording where the candidate's history supports it. Only genuinely evidenced skills.
- experience: return exactly ONE item for EVERY work or project entry in the career history, even the ones that matter least for this posting and even ones from decades ago. Identify each by its "ref" number from the history. Never merge two entries, never split one, never skip one and never rename a job: the employer, location and title are filled in from the history automatically and the order is applied for you. Per item return only: ref, dates (the same dates, tidied: never changed), bullets, and title ONLY for a "grouped" entry (a short truthful title covering its roles).
- Bullets must draw on the candidate's real evidence, not a sample of it. Each history entry has accomplishments, metrics, skills, a summary and "original_notes" (the candidate's own words, which often hold specifics the cleaned-up lists lost: tools, volumes, methods, results). Choose the strongest of that material for this posting. Bullet budget: about 14 bullets in total (12-16), each running 27-35 words - a strong past-tense verb, the scope or scale, how it was done, and the real number or outcome it produced, in a full sentence rather than a fragment. Give 4-5 bullets to the roles that best answer the posting priorities and 2-3 to the rest; when the history holds more than six roles, stay inside the total by keeping only each role's strongest evidence.
- Select by the posting priorities: for every job, lead with the evidence that answers the top priorities, drop what does not help this employer, and word each bullet in the posting's own vocabulary. The same job must read visibly differently for different postings: different bullets chosen, different order, different emphasis. Every bullet starts with a strong past-tense verb, states scope or outcome, and keeps the candidate's real numbers.
- Combined roles: an entry marked "grouped": true holds several positions at ONE employer in its "roles" array. Write exactly ONE experience item for it (by its ref): a short title that covers those roles, and bullets that each begin with the role name and its dates (for example "Project Manager (2016 to 2017): ...") followed by that role's accomplishments, so every role is still visible inside the single employer block. Give every role in it 1-3 bullets, keeping the block inside the total bullet budget. Never split a combined entry back into separate roles and never drop one of them.
- education / certifications: everything the history AND the reference documents evidence (degrees, diplomas, licences, training certificates, safety tickets, Lean / Six Sigma belts), listed in full and never invented. Omit the arrays when there is nothing.
- keywords: 18-30 ATS keywords taken from the posting that the candidate genuinely covers.
- cover_letter: a complete, ready-to-send cover letter for THIS posting, as an array of plain-text paragraphs in reading order (one string per paragraph, no markdown, no bullet lists, no headings, no placeholders such as [Company] or [Your Name]: only real details from the history above). The first entry is exactly "Dear Hiring Manager,". Then 3-4 paragraphs (roughly 250-350 words in total) covering why this role at this employer, the two or three strongest pieces of real evidence that match the posting, and what the candidate would bring to the work the posting describes. The last two entries are the sign-off "Sincerely," and then the candidate's name. The voice is the candidate's own: plain, specific and confident, never flattering or generic, and never a claim the history does not support.
- match_summary: 3-4 sentences telling the candidate, plainly, why this version fits the posting and which of their experience does the heavy lifting.
- gaps: 3-5 short, honest notes on posting requirements the history does not evidence, so the candidate can prepare. Empty array if there are none.

Return the resume content and the cover letter in the given schema.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RESPONSE_SCHEMA
    });

    let resume = result && typeof result === 'object' ? { ...result } : {};
    const priorities = cleanList(resume.posting_priorities, 12, 300);
    resume.experience = buildExperience(resume.experience, entries);
    delete resume.posting_priorities;
    resume.cover_letter = Array.isArray(result?.cover_letter)
      ? result.cover_letter.map((paragraph) => cleanText(paragraph, 4000)).filter(Boolean).join('\n\n')
      : cleanText(result?.cover_letter, 24000);

    // Two full pages is the requirement, and a first pass usually comes back short of it.
    // Measure it, and when it is short, deepen the writing from the same source material.
    if (visibleWordCount(resume) < WORD_FLOOR) {
      const draft = (Array.isArray(resume.experience) ? resume.experience : []).map((job) => ({
        organization: job.organization,
        title: job.title,
        dates: job.dates,
        bullets: job.bullets
      }));
      const expansionPrompt = `You are the same expert resume writer, deepening your own draft. It is too short: this resume must print as TWO FULL PAGES, and the body so far runs about ${visibleWordCount(resume)} words against a target of 600-680 visible words (a full second page, with nothing spilling onto a third).

TARGET ROLE
Job title: ${jobTitle || '(not given)'}
Company: ${company || '(not given)'}

THE POSTING'S PRIORITIES, in order of importance
${JSON.stringify(priorities, null, 2)}

JOB POSTING
"""
${jobDescription}
"""

THE CANDIDATE'S REAL CAREER HISTORY (still the only source of truth; "original_notes" holds the specifics)
${JSON.stringify(entries, null, 2)}

YOUR CURRENT DRAFT
${JSON.stringify(draft, null, 2)}

HOW TO DEEPEN IT
- Return one item per history entry, named by that entry's "ref" number, covering EVERY entry: never drop a role, never merge two, never invent one.
- Per item return the COMPLETE final bullet list for that entry, not just the additions: keep the draft's strongest bullets and expand the rest so each bullet runs 25-45 words and carries the scope or scale, how it was done, and the real number or outcome it produced. Mine everything still unused in accomplishments, metrics, skills, summary and original_notes; an entry holding a dozen real facts should show them.
- Bullet counts: 4-5 across the roles answering the top posting priorities, 2-3 for a supporting or older role. The whole bullet set should land between 400 and 460 words, inside a visible body of 600-680 words.
- summary: 120-160 words (4-6 sentences) working through the posting priorities with the candidate's real evidence.
- skills: 18-24 evidenced skills in the posting's own wording. keywords: 20-30 posting terms the candidate genuinely covers.
- Truthfulness is absolute, exactly as before: no invented employers, titles, dates, numbers, tools or credentials, and no filler adjectives or restated bullets. If an entry's real material is genuinely exhausted, return its draft bullets unchanged rather than padding it.

Return the deepened resume content in the given schema.`;

      const expanded = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: expansionPrompt,
        response_json_schema: EXPANSION_SCHEMA
      });

      if (expanded && Array.isArray(expanded.experience) && expanded.experience.length) {
        const skills = cleanList(expanded.skills, 30, 90);
        const keywords = cleanList(expanded.keywords, 30, 90);
        const longer = {
          ...resume,
          summary: cleanText(expanded.summary, 4000) || resume.summary,
          skills: skills.length ? skills : resume.skills,
          keywords: keywords.length ? keywords : resume.keywords,
          experience: buildExperience(expanded.experience, entries)
        };
        if (visibleWordCount(longer) > visibleWordCount(resume)) resume = longer;
      }
    }

    // The candidate's own job order, once they have set one, wins over newest-first. It only
    // reorders the roles they arranged: anything the order does not name keeps its place.
    resume.experience = applyExperienceOrder(resume.experience, profile.experience_order);

    // The Word file always prints as two full pages, so the saved resume is trimmed the
    // same way: what is on screen is what gets downloaded.
    resume = fitResumeToPages(resume, template);

    return Response.json(resume);
  } catch (error) {
    return Response.json({ error: error.message || 'The tailored resume could not be written.' }, { status: 500 });
  }
}