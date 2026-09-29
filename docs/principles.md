# Design principles

The principles behind every decision in nestjar, and why I hold them. They describe how we think, not how the code is written today, so they should stay true as the product changes.

The Design Principles page (`/system`) shows a condensed version of each. This is the full reasoning.

## 1. Let the data shape the design

_User-centred design is data-driven design_

Understand what the data really is, including the awkward cases, before designing the screens that show it. A design that only works with tidy numbers is not finished.

**Why it matters.** Money is messy. Pay arrives late, currencies move, amounts never divide neatly. When the interface is designed before the data is understood, those cases break it. When the design follows the data, the screen tells the truth, and people trust it.

**How it shows up in the prototype:**

- **Plans and reality are shown side by side.** What was intended and what actually happened are different things, so the interface never blends them.
- **Visuals are driven by real figures.** The signature jar is a live measure of money still waiting for a job, not decoration.
- **Conversions explain themselves.** Wherever money crosses currencies, the screen shows how it was counted.
- **Realistic data, not placeholders.** The prototype is exercised with imperfect, believable data, so the awkward cases are part of the story.

**The question to ask:** What does the data actually look like here, including the messy cases?

## 2. Accessibility is a first-class citizen

_Built in from the first line, not checked at the end_

Accessibility is part of the design from the start, with the same weight as how it looks. Everyone should be able to use it, however they use a device.

**Why it matters.** Adding accessibility at the end is slow, costly and usually incomplete. Building it in from the start tends to make the design clearer for everyone: stronger contrast, plainer words, more predictable behaviour.

**How it shows up in the prototype:**

- **Every journey works with a keyboard alone.** And that is checked automatically, not just hoped for.
- **The brand adapts so text stays readable.** Brand colours are kept, with stronger partners wherever words need more contrast.
- **Familiar controls over clever ones.** Standard buttons, fields and panels, so assistive technology understands them.
- **You always land somewhere sensible.** After moving to a new screen or closing something, focus goes to a place that makes sense.
- **Meaning never relies on colour alone.** States are always written in words too.
- **Phone first.** Designed for one hand on a small screen, then expanded for larger ones.

**The question to ask:** Could someone finish this using only a keyboard, or only a screen reader?

## 3. Architecture is not an afterthought

_A prototype is the first version of the product_

Build the prototype the way the product will need to grow. Structure it so each part can be swapped or scaled without starting again.

**Why it matters.** Prototypes that "work for now" tend to become the product, and untangling them later costs far more than structuring them early. Clear boundaries also let other people, and tools like Claude Code, build on top without breaking things.

**How it shows up in the prototype:**

- **Structure is planned before code exists.** So moving from a sketch to a real codebase is a mechanical step, not a rewrite.
- **Stand-in data behaves like the real thing.** Connecting the real backend changes where data comes from, not how the product works.
- **The rules live apart from the screens.** The logic of budgeting is tested on its own, so a redesign cannot quietly break it.
- **Built to grow.** More people, more budgets or more currencies should need new data, not a new design.

**The question to ask:** If this works, what would it take to make it real, and can that change be small?

## 4. Question the first answer

_A first idea is a starting point, not a decision_

Before settling on a structure, a flow or a visual, ask why it is that way and whether it matches how people actually think and behave. A first answer can look fine and still be wrong.

**Why it matters.** The most expensive mistakes are assumptions baked in early, especially in how the product is structured underneath. Challenging them while they are cheap to change is how a product ends up feeling natural instead of forced.

**How it shows up in the prototype:**

- **The structure mirrors real life.** How the product models people and money is tested against real situations, not just the easiest thing to build.
- **Friction is treated as a design problem.** If people have to piece information together across screens, the layout changes, not the person.
- **Metaphors are judged by meaning.** A visual has to say the right thing, not just look good.
- **Reasons are written down.** Decisions are recorded with why, so they can be challenged again later.

**The question to ask:** What are we assuming here, and what breaks if it is wrong?

## 5. Get the details right

_Close enough is not good enough_

Hold the work to the standard of the real thing: the numbers, the brand and the small interactions. People notice when something is slightly off, even when they cannot say why.

**Why it matters.** Trust in a money app is built on precision. The same care that keeps figures exact keeps the brand faithful and every interaction predictable.

**How it shows up in the prototype:**

- **Figures are exact.** Nothing is rounded for convenience, ever.
- **Brand assets are used faithfully.** The real artwork, colours and type, not approximations.
- **Small moments get full care.** What a button says, how an error reads, where focus lands.

**The question to ask:** Would this hold up side by side with the real thing?

## 6. Do less, fully

_Finish the path that matters, and name what is parked_

Choose the core journey and make it complete and polished. Everything else is either clearly marked as not yet, or left out on purpose, never half-built.

**Why it matters.** A half-finished feature looks like a bug. A clearly parked one looks like a plan. Focusing on one complete story shows the idea properly and keeps hard problems honest.

**How it shows up in the prototype:**

- **The core journey is complete.** Start to finish, with nothing faked along the way.
- **Unfinished areas explain themselves.** They are visible, and say what they will do, instead of breaking.
- **Hard problems are parked honestly.** Each one is written down with a clear "for now", not half-built.

**The question to ask:** Is this finished, or clearly marked as not yet?
