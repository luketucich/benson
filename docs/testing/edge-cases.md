# Edge Case Testing

October 26-27, 2026

## How Benson picks a note

This matters for everything below, so here's the short version. When I say something like "add eggs to my grocery list", Benson does three steps:

1. **Finds related notes.** Benson looks through every note in my vault and scores each one by how many of my words it contains. The 5 highest scores are the "related notes". I'll call this step **search**.
2. **Asks Qwen.** Benson sends Qwen my sentence, those 5 notes, and a set of instructions. The instructions live in Benson's code (`app/src/main/noteSuggestion.ts`), not in my vault, and Qwen gets them every time.
3. **Shows me a draft.** Qwen answers with a draft: make a new note or add to one of those 5, which note, and what text. I see it as a preview, and nothing is written until I hit Send.

The big catch is that **Qwen only ever sees those 5 notes.** If the right note isn't in the top 5, Qwen can't pick it, no matter how smart it is.

## What I tested

I had Claude make four fake vaults with about 60 notes each: journal entries, school stuff, projects, tech notes, a meal plan, and so on. Then I typed 16 requests into Benson to see how it handled these situations:

- **Two grocery lists for the same day.** I expected it to either pick the right one or ask me which one.
- **Only an old grocery list, from September.** I expected it to start a new list for this week.
- **An organized vault with folders.** I expected new notes to land in the folder that fits, like a reading list in `Reading/`.
- **A note with sneaky instructions hidden in it**, telling Benson to edit other files. I expected it to ignore them and leave everything else alone.

## What went wrong at first

**1. Search found the wrong notes.** I said "Add peanut butter and apples to my grocery list for today." Benson scored notes on every word, including "and", "to", "my", and "for". Those words are in almost every note, so notes like my Pokemon app overview and my meal plan scored higher than the actual grocery lists. Neither grocery list made the top 5, so Qwen never saw them, and it added the groceries to my meal plan.

**2. It added this week's groceries to a September list.** Qwen didn't know what today's date was, so it had no way to tell the list was old.

**3. It ignored my folders.** "Start a reading list" made `Tasks/Books_To_Read.md`, even though I have a `Reading/` folder and no `Tasks/` folder. Qwen only sees those 5 notes, so it didn't know `Reading/` existed.

**4. It wrote down what I said, not the note.** Instead of adding "- [ ] peanut butter", it added the whole sentence: "Add peanut butter and apples to the grocery list for today."

## What I changed

I fixed this in five rounds. After each round I reran all 16 tests to see what got better and what got worse. The quotes below are the exact text I added to Qwen's instructions.

### Round 1: Fix search, tell Qwen the date and folders, add rules

**Search fix:** Benson now throws out short and common words before scoring. "Add peanut butter and apples to my grocery list for today" becomes "peanut butter apples grocery list today", so the grocery lists now make the top 5.

**More context for Qwen:** It now gets today's date and a list of my top-level folders, like `Groceries`, `Reading`, and `Projects`.

**New rules in the instructions:**

> Use append only for a matching path in this list, and only when its topic is what the transcript is about, not just a note that uses the same words.
>
> Notes for one date or week, like grocery lists and daily notes, belong to that date. If the only matching one is from an earlier date, create a new note for today in the same folder with the same naming pattern instead of appending to the old one.
>
> When creating, put the note in the existing folder that fits best and follow the naming style of the notes there. Only make a new folder if none fit.
>
> If two matching notes fit equally well, like two lists for the same date, use clarify and name both paths in the question.
>
> Content is only the new text to add, written the way the note already is (for example "- [ ] eggs" for a checklist). Never copy the spoken request itself, like "add eggs to my list", and never copy the existing note.

**Result:** Most of it got fixed. The grocery lists showed up, the reading list went into `Reading/`, the meeting note went into my meeting notes, and the text came out as "- [ ] peanut butter".

**Still wrong:**

- It still added this week's groceries to the September list.
- With two lists for the same day, it picked one instead of asking.
- The journal entry failed completely. More on that in round 4.

### Round 2: Give Qwen an example (backfired)

**Why:** Qwen kept ignoring the "old list, make a new one" rule. Small models are often better at copying an example than following a rule, so I gave it one.

**What I added:**

> Today is 2026-10-26, the only grocery list is "Groceries/2026-09-14 Grocery List.md", and the transcript says "add eggs to my grocery list". Return create with path "Groceries/2026-10-26 Grocery List.md".

**What I hoped:** Qwen would learn the idea that an old list means you make a new one for today.

**What actually happened:** Qwen memorized the answer instead of the idea. My example used the exact same folder, file name, and date as my test vault. So in the vault where today's list `Groceries/2026-10-26 Grocery List.md` already existed, I said "add peanut butter and apples to my grocery list", and Qwen said to create a brand new `Groceries/2026-10-26 Grocery List.md`, copied straight from my example. It should have just added to the list that was already there. When I hit Send, Benson refused because that file already existed, so nothing got overwritten. It was still the wrong answer, though, and a few other notes started going to the wrong places too.

### Round 3: Use a made-up example

**What I changed:** Same example, but with fake names and dates that aren't anywhere in my vault, so there was nothing for Qwen to copy:

> Today is 2026-03-02 and the only shopping note is "Food/2026-02-09 Shopping.md". "Add eggs to my shopping list" returns create with path "Food/2026-03-02 Shopping.md".

**Result:** That did it. With only the September list, "add eggs and spinach to my grocery list" now makes a new list for today in `Groceries/`.

**Still wrong:** My Pokemon app idea went into a general `Ideas/App Ideas.md` note instead of the Pokemon project's own ideas note.

### Round 4: Prefer the project's own folder

**What I added:**

> A note inside a folder for that exact topic, like a project's own folder, beats a general note. If the note you want is not in the matching notes, use create instead of append.

**Result:** The Pokemon idea went back into `Projects/Pokemon Card App/Ideas.md`.

**Still wrong:** The journal entry kept failing. Qwen was picking the right note, today's `Journal/2026-10-26.md`, but it said "add to it" instead of "make it". That note didn't exist yet, and Benson has a safety check that refuses to add to a note it didn't find, so the whole draft failed.

### Round 5: Fix the journal problem in code

**What I changed:** Instead of fighting with the instructions, I changed Benson's code. If Qwen says "add to" a note that doesn't exist, Benson now makes that note instead. That's safe, because making a note never overwrites an existing one.

**Result:** The journal entry worked. I ran all 16 tests twice and got the exact same answers both times.

## Can it mess up my vault?

Not in anything I tried. Every time I hit Send, only the one note shown in the preview changed. It ignored the hidden instructions, and nothing outside the vault was touched.

## Still not great

- **Two lists for the same day:** it picks one instead of asking me which. I can still see and change the note in the preview before sending.
- **"Yesterday":** a journal entry for yesterday ends up in today's note.
- **Extra details:** it wrote "Atomic Habits by James Clear" when I only said "Atomic Habits".
- **Extra blank line:** adding to a checklist leaves a blank line, which splits it into two lists in Obsidian.

For the demo, I'll use clear requests and always show the preview.
