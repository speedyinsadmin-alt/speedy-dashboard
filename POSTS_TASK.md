# Weekly Google Business Profile posting task

**Repo:** `speedyinsadmin-alt/speedy-dashboard` · **Owner:** Saif · **Updated:** August 7, 2026

This file is the single instruction set for the weekly GBP posting task. Everything the task needs lives in this repo — do not rely on chat history or memory for post copy, hours, or graphics.

---

## Files

| File | Purpose |
|---|---|
| `posts.json` | All post copy, languages, CTAs, links, and the image path per branch |
| `posts_log.json` | What has already been published — read this to find the rotation position |
| `img/posts/*.png` | The graphics, one per theme × language × branch |
| `posts.html` | Human view of the same data |

Raw file URL pattern:
`https://raw.githubusercontent.com/speedyinsadmin-alt/speedy-dashboard/main/<path>`

---

## Verified hours — never contradict these

- **Mon–Fri** 9am–7pm
- **Sat** 10am–5pm
- **Sun** Moreno Valley **only**, 10am–5pm. Van Buren, Magnolia and Lake Elsinore are **closed**.

Any post copy that claims "open 7 days" or "9am–8pm" is stale. Stop and flag it rather than publishing it.

---

## Weekly run

1. **Read** `posts.json` and `posts_log.json` from the repo.
2. **Find the rotation position.** The rotation is `sr22 → dmv → hours → freequote`. Look at the most recent entry per branch in `posts_log.json` and pick the next theme for each branch. If the log is empty, start at `sr22`.
3. **Moreno Valley substitution:** on the `hours` week, Moreno Valley publishes the `sunday` theme instead. The `sunday` theme is **Moreno Valley only** — never publish it on Van Buren, Magnolia or Lake Elsinore.
4. **For each of the four branches**, assemble:
   - the post `text` for that theme (English)
   - the **branch's own graphic** — read `posts.json`, find the post object for the chosen theme, and take `images[<branch>]` for that branch. Each theme has a dedicated, branded picture per branch already made and stored in this repo. Download it from:
     `https://raw.githubusercontent.com/speedyinsadmin-alt/speedy-dashboard/main/<images[branch] path>`
     Example — SR-22 week, Van Buren: `images.vb` = `img/posts/sr22_en_vb.png` → download `https://raw.githubusercontent.com/speedyinsadmin-alt/speedy-dashboard/main/img/posts/sr22_en_vb.png` and attach that exact file to the Van Buren post.
   - **Confirm the branch code** in the filename matches the profile you are posting to (`_mv` Moreno Valley, `_vb` Van Buren, `_mg` Magnolia, `_le` Lake Elsinore). Never attach one branch's graphic to another branch's profile.
   - the `cta` button and `link`

   Available graphics (all 34 pre-made, in `img/posts/`): themes `sr22`, `dmv`, `hours`, `freequote` each have EN + ES × all 4 branches; `sunday` has EN + ES for Moreno Valley only.
5. **Spanish second post:** on Moreno Valley and Magnolia only, also prepare the `ES` version of the same theme with its `_es_` graphic.
6. **Publish** — open `business.google.com`, select the branch profile, choose *Add update*, paste the text, attach the graphic, set the button and link.
7. **STOP before pressing Post.** Leave it filled in and ready. Saif reviews and clicks Post himself. Do not publish public content unattended.
8. **Report** a summary listing each branch, the theme chosen, the graphic filename, and anything that looked wrong.
9. **Update the log** — append one entry per post to `posts_log.json` and push it, using the GitHub token held in the project. If the push is not possible, put the entries in the report so the log can be updated by hand.

### Log entry shape

```json
{ "date": "2026-08-10", "branch": "mv", "theme": "sr22", "lang": "EN", "image": "img/posts/sr22_en_mv.png" }
```

---

## Checks before every publish

- Branch code in the graphic filename matches the profile being posted to. A Magnolia graphic on the Lake Elsinore profile is the most likely mistake and the most visible one.
- The post text does not contradict the hours above.
- Post is under 1,500 characters.
- Spanish posts link to `speedyins.com/es.html`, not the English page.

---

## Review replies — separate task, different rules

Reply templates are in `posts.json` under `replies`. Rules:

- Reply in the language the review was written in.
- Use the reviewer's first name where the template has `[Name]`.
- **Never confirm policy details, client status, or any other PII** — not even to correct a reviewer or defend the agency. This applies regardless of what the review claims.
- **1–2 star reviews and suspected-fake reviews are not auto-reply cases.** Draft the reply, escalate to Saif, and let him send it. A wrong reply to an angry customer is public and permanent.
- Anything ambiguous → escalate rather than guess.

---

## Refresh the GBP dashboard numbers (each run)

While you are in `business.google.com` for posting, you are already looking at each branch profile. Capture the current numbers and update `gbp.html` in this repo so the dashboard stays honest.

For each of the four branches, read from the live Google profile:
- the **total review count**
- the **star rating** (e.g. 4.9)

Then update `gbp.html`:
1. Each branch card has a `<div class="star">X.X★</div>` and `<div class="rev">N reviews</div>` — set these to the live numbers.
2. Update the top KPIs: **Total reviews** (sum of all four) and **Avg rating** (review-weighted average across the four branches).
3. Update the header date `<div class="updated">Last updated<br><strong>MONTH D, YYYY</strong></div>` to today's date.
4. Push `gbp.html` with a fresh SHA (fetch SHA immediately before the PUT).

If you cannot read a branch's number for any reason, leave that branch's existing number unchanged and note it in the report rather than guessing.

**Branch → card mapping in gbp.html:** Van Buren, Magnolia, Moreno Valley, Lake Elsinore (in that order in the file).

---

## Known gaps

- There is no Google Business Profile API connector available, so publishing is browser-driven, not API-driven.
- Van Buren, Magnolia and Lake Elsinore still need refreshed profile photos.
- Verify Moreno Valley's Sunday hours are actually showing 10am–5pm on Google before the `sunday` post runs — a July screenshot showed it listed as closed.
