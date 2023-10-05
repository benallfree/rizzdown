# 🌟 `rizzdown` 🌟 - Markdown's Dazzling BFF!

Ever felt your Markdown filled with your beautiful prose were the wallflowers at the prom? Not when `rizzdown` is your date! Turn that `md` frown upside down and give your content the shimmer and shine it deserves! 🎉

Designed for technical authors and devs creating their linguistic empire using markdown content and SSG sites. Let's get your content poppin'!

<!-- TOC -->

- [🌟 `rizzdown` 🌟 - Markdown's Dazzling BFF!](#-rizzdown----markdowns-dazzling-bff)
- [Features](#features)
- [Usage](#usage)
- [How it Works](#how-it-works)
- [Tips](#tips)
- [🧠 The `rizzdown` Intelligence: Crafting the Perfect Prose 🪶](#-the-rizzdown-intelligence-crafting-the-perfect-prose-)
- [🗝 OpenAI API Key - The Magic Wand! 🪄](#-openai-api-key---the-magic-wand-)
- [Contribute](#contribute)

<!-- /TOC -->

# Features

- 🚀 Instant Enhancements: Upgrade from mundane to magnificent with a simple command!
- 🌈 Markdown-Friendly: Designed with `.md` files in mind.
- 💡 Frontmatter Magic: Auto-generate `description`, `title`, and `# Overview`, and even rewrite your original content!
- 🦥 Exponential Backoff: We're gentle with the GPT API. No throttling woes here!

# Usage

1. **Installation**:

   Get `rizzdown` into your toolbelt:

   ```bash
   npm i -g rizzdown
   ```

   OR just run on-the-fly with:

   ```bash
   npx rizzdown
   ```

2. **Command & Conquer**:

   Navigate to your Markdown file's directory and simply:

   ```bash
   rizzdown enhance --dry-run myfile.md
   ```

3. **Adjust & Admire**:

   Peek into your newly-enhanced Markdown file. Tweak as you see fit and bask in its improved glory!

# How it Works

When I created `rizzdown`, I wrote this:

> I have a CLI tool which enhances markdown files using ChatGPT by taking into account author, audience, subject matter, type of prose, and body content. It then produces a `description` and `title` for frontmatter and an `# Overview`. it can also rewrite the entire content if requested. everything is fully controlled by the command line, and it even has exponential backoff in case of GPT API throttling. You install it using `npm i -g <tool>` or `npx <tool>`

...and `rizzdown` turned it into...

> <h3>Wait, no. Y-yo-you're reading it right now?!</h3>

That's right, I used `rizzdown` to write this `readme.md`! Look at that, you're the belle of the ball. Perfect for all you authors crafting SSG sites and wanting your Markdown to be not just readable, but _rizzmarkable_.

# Tips

- ✨ Perfect for SSG buffs: If you're all about static site generators, `rizzdown` will be your go-to for content enhancement!
- 🤖 Trust but verify: While `rizzdown` is one smart cookie, always review the magic to ensure it matches your voice and intent!

# 🧠 The `rizzdown` Intelligence: Crafting the Perfect Prose 🪶

You might wonder, "How does `rizzdown` turn my Markdown from mundane to magical?" The secret sauce isn't just algorithmic—it's empathetic, intuitive, and tailored.

<h3>Deep Understanding</h3>

Here's how `rizzdown` finely tunes its enchantment:

1. **Intent of Writing**:

   Whether you're penning a technical documentation, sharing thoughts in a blog, or weaving a world in a novel, `rizzdown` gets it. It understands the innate structure and nuances of different writing styles and molds its enhancements accordingly.

2. **Author's Bio**:

   Your voice. Your style. Your unique flare. By absorbing tidbits from your bio, `rizzdown` ensures that the prose remains authentically _you_.

3. **Target Audience**:

   Who are you writing for? Tech-savvy developers? Enthusiastic foodies? A general audience seeking knowledge? `rizzdown` tailors the content to resonate with your readers, striking the right chord every time.

4. **Subject's Background Knowledge**:

   Every domain has its shared knowledge, its set of jargon, its common truths. `rizzdown` recognizes this and crafts content that's insightful without being redundant.

<h3>The Result</h3>

By synthesizing all these elements, `rizzdown` creates prose that:

- Speaks in your voice 🗣
- Engages your target audience 👥
- Resonates at the perfect knowledge depth 📚
- Aligns with the intended writing style 🖋

<h3>Perfectly Tailored, Every Time</h3>

With `rizzdown`, you're not just getting enhanced content; you're getting content that fits like a custom-tailored suit, designed with precision and a dash of flair. Say goodbye to generic edits and hello to prose that truly _pops_!

# 🗝 OpenAI API Key - The Magic Wand! 🪄

For `rizzdown` to sprinkle its enchantment on your Markdown, it relies on some wizardry powered by OpenAI's GPT model. For this magic to work, you'll need an OpenAI API key.

<h3>How to Obtain Your OpenAI API Key</h3>

1. **Sign Up or Log In**:

   Begin your quest by heading over to [OpenAI](https://beta.openai.com/signup/). If you're already a member of this magical realm, simply log in.

2. **API Section**:

   Once you're in, navigate to the API section. Here, you'll be presented with the option to generate your unique API key.

3. **Copy & Keep It Safe**:

   Generate your key, copy it, and store it somewhere safe. Treat it like the precious artifact it is! 📜💎

4. **Integrate with `rizzdown`**:

   When running `rizzdown`, you'll be prompted for the API key. Simply paste it in, and voila! The magic flows!

<h3>A Word of Caution</h3>

- 🚫 **Never Commit Your API Key**: If you're storing your API key in any config or settings file, ensure it's ignored in your version control. You wouldn't want your magical powers to fall into the wrong hands!
- 📆 **Mind The Quota**: OpenAI might have request limits depending on your account type. Be sure to keep an eye on your usage to avoid any interruptions in your enchanting sessions.

With your OpenAI API key in hand, you're all set to unleash the full power of `rizzdown`! Let the transformations begin! 🌌🌠

# Contribute

Love the dazzle and have ideas to sprinkle more fairy dust? We welcome contributions! Check out our `CONTRIBUTING.md` for guidelines.
