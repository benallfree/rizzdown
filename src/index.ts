#!/usr/bin/env tsx

import Bottleneck from 'bottleneck'
import commander, { program } from 'commander'
import { backOff } from 'exponential-backoff'
import fm from 'front-matter'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  writeSync,
} from 'fs'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { join } from 'path'
import yaml from 'yaml'
import inquirer from 'inquirer'
import { prompt } from 'enquirer'
import chalk from 'chalk'
import check from 'check-node-version'
import figlet from 'figlet'
import { FONTS, getFontInfo } from './fonts'
import { shuffle } from '@s-libs/micro-dash'
import updateNotifier from 'update-notifier'
import packageJson from '../package.json' assert { type: 'json' }
import { homedir } from 'os'

updateNotifier({ pkg: packageJson }).notify()

const { font, holiday, color } = getFontInfo()
figlet('rizzdown', { font: 'ANSI Regular' }, async (err, data) => {
  if (err) {
    return
  }
  const c = chalk.hex(color)
  console.log(`\n\n`, data)
  console.log(`Version ${packageJson.version}`)
  if (holiday) {
    await new Promise<void>((resolve) => {
      figlet(`Happy ${holiday}!`, { font }, function (err, data) {
        if (err) {
          return
        }
        console.log(c(data))
        resolve()
      })
    })
  }
  console.log(`\n\n`)
})

function myParseInt(value: string, dummyPrevious: number) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.')
  }
  return parsedValue
}

;(async () => {
  await new Promise<void>((resolve) => {
    check({ node: '>= 16' }, (error, result) => {
      if (error || !result.isSatisfied) {
        console.log(chalk.red(`Oops! rizzdown requries node 16 or higher!`))
        process.exit(1)
      }
      resolve()
    })
  })

  const RIZZ_HOME_DEFAULT = join(homedir(), `.rizzdown`)

  const p = console.log

  const home = await (async () => {
    const RIZZ_HOME = process.env.RIZZDOWN_HOME || RIZZ_HOME_DEFAULT
    if (!existsSync(RIZZ_HOME)) {
      p(
        chalk.yellow(
          `It looks like you haven't used rizzdown before. Let's get started with a few questions!`
        )
      )
      const response = await prompt<{ home: string }>({
        type: 'input',
        name: 'home',
        message: 'Where should rizzdown store its profile information?',
        initial: RIZZ_HOME_DEFAULT,
      })
      const { home } = response
      if (home !== RIZZ_HOME_DEFAULT) {
        p(
          `Since you specified a custom location, you'll need to add this your .profile, .zshrc, or .bashrc:\nRIZZ_HOME=${home}\n\n`
        )
      }
      mkdirSync(home, { recursive: true })
      return home
    }
    return RIZZ_HOME
  })()
  p(`Loading from ${home}`)

  program.name('rizzdown').description('Add rizz to your md').version('0.0.1')

  program
    .command('enhance')
    .description('Enhance your md, just like on TV.')
    .argument(`<path>`, `Path to your Markdown file.`)
    .option(
      `-p,--profile <profile>`,
      `The profile you wish to use for this enhancement.`,
      `default`
    )
    .option(
      `-k,--api-key <key>`,
      `OpenAPI key (default: OPENAI_SECRET_KEY env var)`,
      process.env.OPENAI_SECRET_KEY
    )
    .option(
      `-m,--max-concurrent <threads>`,
      `Maximum number of GPT calls to make simultaneously.`,
      myParseInt,
      1
    )
    .option(
      `-f,--full`,
      `Perform a full refresh, even if frontmatter and overview are already present.`,
      false
    )
    .option(`-d,--dry-run`, `Do not call API or write to files`, false)
    .option(`-sf,--no-frontmatter`, `Skip frontmatter generation`, true)
    .option(`-so,--no-overview`, `Skip overview generation`, true)
    .action(async (_path, options) => {
      const {
        dryRun,
        full,
        frontmatter,
        overview,
        maxConcurrent,
        profile,
        apiKey,
      } = options
      const paths = program.args.slice(
        program.args.findIndex((v) => v === _path)
      )
      console.log({ profile, options, paths })

      p(`Using profile: ${profile}`)

      const profilePath = join(home, profile)
      mkdirSync(profilePath, { recursive: true })

      const styleContext = await (async () => {
        const writingStyle = join(home, profile, `style.md`)
        if (existsSync(writingStyle)) {
          return readFileSync(writingStyle).toString()
        }
        p(
          chalk.yellow(
            `It looks like you haven't created a style definition yet. Let's do it now!`
          )
        )
        const response = await prompt<{ answer: string }>({
          type: 'input',
          name: 'answer',
          message: `Please describe the style, tone, and platform of your writing.`,
          initial: `I'm writing a serious blog about North American flowers. I travel around and take pictures and post them along with scientific facts. The tone of the blog is scientific and exact. Very detailed and deep.`,
        })
        const { answer } = response
        writeFileSync(writingStyle, answer)
        return answer
      })()

      const authorContext = await (async () => {
        const authorPath = join(home, profile, `author.md`)
        if (existsSync(authorPath)) {
          return readFileSync(authorPath).toString()
        }
        p(
          chalk.yellow(
            `It looks like you haven't created an author definition yet. Let's do it now!`
          )
        )
        const response = await prompt<{ answer: string }>({
          type: 'input',
          name: 'answer',
          message:
            'Please provide an author bio. Personality, background, interests, etc.',
          initial: `I am a flower expert and I'm very serious about it. I don't joke around. I have a PHD in botany and am a guest lecutrer at Stanford.`,
        })
        const { answer } = response
        writeFileSync(authorPath, answer)
        return answer
      })()

      const subjectContext = await (async () => {
        const subjectPath = join(home, profile, `subject.md`)
        if (existsSync(subjectPath)) {
          return readFileSync(subjectPath).toString()
        }
        p(
          chalk.yellow(
            `It looks like you haven't created a subject definition yet. Let's do it now!`
          )
        )
        const response = await prompt<{ answer: string }>({
          type: 'input',
          name: 'answer',
          message: `Please give some background information about your subject. Things people would already know that are "common knowledge" in the subject domain. Be brief but detailed.`,
          initial: `North America boasts a diverse range of native flowers, adapted to its varying climates and terrains. The sunflower, native to the continent, is not only admired for its beauty but also harvested for its seeds. The columbine, with its unique spurred petals, is commonly found in woodlands and higher altitudes. Dogwoods, producing beautiful white or pink bracts, are popular ornamental trees. The California poppy, with its bright orange blooms, is California's state flower. Goldenrods are often mistakenly blamed for hay fever, but it's actually ragweed causing those symptoms. The bluebonnet, a lupine, paints Texan roadsides blue every spring. The trillium, found in eastern woodlands, is considered a symbol of the American wilderness.`,
        })
        const { answer } = response
        writeFileSync(subjectPath, answer)
        return answer
      })()

      const audienceContext = await (async () => {
        const audiencePath = join(home, profile, `audience.md`)
        if (existsSync(audiencePath)) {
          return readFileSync(audiencePath).toString()
        }
        p(
          chalk.yellow(
            `It looks like you haven't created an audience definition yet. Let's do it now!`
          )
        )
        const response = await prompt<{ answer: string }>({
          type: 'input',
          name: 'answer',
          message: `Please describe your ideal audience. Include characteristics about their knowledge, personality, and any other details you might think of.`,
          initial: `My audiance is botany hobbiests. They have a lot of knowledge, but they typically don't study or read books. They post a lot on social media when they find a nice flower when going for a hike. They appreciate descriptions about colors, genetics, and especially how to grow their own kind of whatever I am writing about.`,
        })
        const { answer } = response
        writeFileSync(audiencePath, answer)
        return answer
      })()

      const _apiKey = await (async () => {
        if (apiKey) return apiKey

        const apiKeyPath = join(home, profile, `openai-key`)
        if (existsSync(apiKeyPath)) {
          return readFileSync(apiKey).toString()
        }
        p(
          chalk.yellow(
            `It looks like you haven't created an OpenAI Secret Key yet. You can either pass it in as OPENAI_SECRET_KEY environment variable, or use the --api-key switch`
          )
        )
        const response = await prompt<{ answer: string }>({
          type: 'input',
          name: 'answer',
          message: `OpenAI Secret Key (https://platform.openai.com/)`,
          initial: ``,
        })
        const { answer } = response
        writeFileSync(apiKey, answer)
        return answer
      })()

      const openai = new OpenAI({
        apiKey: _apiKey,
      })

      const generate = async (path: string, prompt: string) => {
        console.log(`Generating ${prompt} for ${path}`)
        if (dryRun) return `API skipped`
        const messages: ChatCompletionMessageParam[] = [
          {
            role: 'user',
            content: `I'm going to ask you to enhance some writing for me. Here is a little about me, the author. Use this information to write in my 'voice':`,
          },
          {
            role: 'user',
            content: authorContext,
          },
          {
            role: 'user',
            content: `Here is some information about my target audience. In formulating your response, use this information to choose wording and mood.`,
          },
          {
            role: 'user',
            content: audienceContext,
          },
          {
            role: 'user',
            content: `Here is some information about the general subject and interest area of my writing. Assume the reader knows most of this, but use it as background information and to reference existing knowledge.`,
          },

          {
            role: 'user',
            content: subjectContext,
          },
          {
            role: 'user',
            content: `Here is some information about the writing style I want to use.`,
          },
          {
            role: 'user',
            content: styleContext,
          },
          {
            role: 'user',
            content: `Finally, here is the subject matter to enhance. This is new information for the reader. Assume they have no prior knowledge if the information provided here is not mentioned in the background information either.`,
          },
          {
            role: 'user',
            content: readFileSync(path).toString(),
          },
          {
            role: 'user',
            content: `Given all that information, ${prompt}`,
          },
        ]
        const chatCompletion = await backOff(
          () =>
            openai.chat.completions.create({
              messages,
              model: 'gpt-4',
            }),
          {
            retry: (e) => {
              console.warn(`${e}`)
              return true
            },
            numOfAttempts: 1000,
          }
        )

        const content = chatCompletion.choices[0].message.content || ''
        console.log(`\t${content.slice(0, 50)}...`)
        return content
      }

      const limiter = new Bottleneck({ maxConcurrent })

      await Promise.all(
        paths.map((path) =>
          limiter.schedule(async () => {
            console.log(`\n\n=======\n${path}\n=======`)

            if (frontmatter) {
              console.log(`Generating frontmatter`)
              const src = readFileSync(path).toString()
              const parsed = fm<{ description?: string }>(src)
              const { attributes, body } = parsed

              const hasDescription = attributes.description

              if (!hasDescription || full) {
                const shortSummary = await generate(
                  path,
                  `Please write a <50 word paragraph digest of the subject matter. It is for meta tags and opengraph, so it should include full context.`
                )
                if (!dryRun) {
                  console.log(`Writing summary for ${path}`)

                  attributes.description =
                    shortSummary || attributes.description
                  const frontmatter = yaml.stringify(attributes)
                  writeFileSync(path, `---\n${frontmatter}\n---\n\n${body}`)
                } else {
                  console.log(shortSummary)
                }
              } else {
                console.log(`Already has frontmatter. Skipping.`)
              }
            }

            if (overview) {
              console.log(`Generating overview`)
              const src = readFileSync(path).toString()
              const parsed = fm<{ description?: string }>(src)
              const { attributes, body } = parsed
              const sections = body.split(/\n(?=\#)/) // This splits the content at each markdown header
              const idx = sections.findIndex((section) =>
                section.startsWith('# Overview')
              )
              const hasOverview = idx >= 0

              const overviewIndex = (() => {
                if (idx >= 0) return idx
                sections.unshift(`# Overview\n\n`)
                return 0
              })()

              if (!hasOverview || full) {
                const introduction = await generate(
                  path,
                  `Please write a ~200 word multiparagraph digest of the subject matter. Use an instructive voice, don't refer to "i" or "we". Just directives. Don't say "welcome" or anything like that, just dive into the discussion.`
                )
                if (!dryRun) {
                  sections[overviewIndex] = `# Overview\n\n${introduction}\n\n`

                  // Combine the sections back into a single string
                  const newContent = sections.join('\n')

                  const frontmatter = yaml.stringify(attributes)
                  writeFileSync(
                    path,
                    `---\n${frontmatter}\n---\n\n${newContent}`
                  )
                } else {
                  console.log(introduction)
                }
              } else {
                console.log(`Already has overview. Skipping.`)
              }
            }

            // const conclusion = await generate(
            //   `Please write a ~300 word conclusion to the following. Don't say "in conclusion" or "in summary" or anything like that, just wrap it up.`,
            // )
            // console.log(`\n\n=======\nConclusion\n=======`)
            // console.log(conclusion)
          })
        )
      )
    })

  program.parse()
})()
