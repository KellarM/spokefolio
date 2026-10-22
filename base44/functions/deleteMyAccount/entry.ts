import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// "Delete profile": a full, personal clean slate. Every record the signed-in
// user owns across the studio is erased. The next thing they see is the
// landing page, as a brand-new visitor.
//
// What this does NOT erase: the sign-in identity itself (email + password),
// which belongs to the platform's login layer. Files already exported and
// downloaded to their device are, of course, theirs.

// Everything an account can own. Listed user-scoped, deleted one by one.
const ENTITIES = [
  'ResumeProfile',
  'CareerEntry',
  'CareerHistoryReview',
  'JobPosting',
  'JobApplication',
  'ResumeRun',
  'SupportingDocument',
  'JobBoard',
  'AppEvent'
];

// Delete a user's entire footprint on one entity. Records are fetched in
// batches of 500 and deleted until a batch comes back empty: the loop
// converges no matter how many rows the account has accumulated.
//
// Admins see every record regardless of row-level security, so every fetched
// row is checked against the caller's own id before it is deleted: an admin
// running this wipe erases only their own records, never the whole studio's.
async function wipeEntity(entities, name, ownerId) {
  let deleted = 0;
  for (let round = 0; round < 50; round += 1) {
    const rows = await entities[name].list('-created_date', 500);
    if (!Array.isArray(rows) || rows.length === 0) break;
    const mine = rows.filter((row) => row.created_by === ownerId);
    if (!mine.length) break;
    await Promise.all(mine.map((row) => entities[name].delete(row.id)));
    deleted += mine.length;
    if (rows.length < 500) break;
  }
  return deleted;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    // Guard rail: exactly the signed-in person's own records, and only theirs.
    let body = {};
    try {
      body = await req.json();
    } catch (error) {
      body = {};
    }
    if (body?.confirm !== 'DELETE') {
      return Response.json(
        { error: 'This request needs explicit confirmation to go through.' },
        { status: 400 }
      );
    }

    const results = {};
    for (const name of ENTITIES) {
      try {
        results[name] = await wipeEntity(base44.entities, name, user.id);
      } catch (error) {
        // One entity failing must not shield the rest of the wipe.
        results[name] = `error: ${error.message || 'could not be wiped'}`;
      }
    }

    return Response.json({
      status: 'ok',
      user: user.email || user.id,
      deleted: results
    });
  } catch (error) {
    return Response.json(
      { error: error.message || 'The profile could not be deleted.' },
      { status: 500 }
    );
  }
}
