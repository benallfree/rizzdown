#!/usr/bin/env tsx

import Bottleneck from 'bottleneck'
import chalk from 'chalk'
import check from 'check-node-version'
import commander, { program } from 'commander'
import { prompt } from 'enquirer'
import figlet from 'figlet'
import fm from 'front-matter'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import updateNotifier from 'update-notifier'
import yaml from 'yaml'
import packageJson from '../../../package.json' assert { type: 'json' }
import factory from './core'
import { getFontInfo } from './fonts'

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
          `It looks like you haven't used rizzdown before. Let's get started with a few questions!`,
        ),
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
          `Since you specified a custom location, you'll need to add this your .profile, .zshrc, or .bashrc:\nRIZZ_HOME=${home}\n\n`,
        )
      }
      mkdirSync(home, { recursive: true })
      return home
    }
    return RIZZ_HOME
  })()
  p(`Loading from ${home}`)

  program.name('rizzdown').description('Add rizz to your md').version('0.0.1')

  type Options = {
    dryRun: boolean
    full: boolean
    frontmatter: boolean
    overview: boolean
    maxConcurrent: number
    profile: string
    apiKey: string
  }
  program
    .command('enhance')
    .description('Enhance your md, just like on TV.')
    .argument(`<path>`, `Path to your Markdown file.`)
    .option(
      `-p,--profile <profile>`,
      `The profile you wish to use for this enhancement.`,
      `default`,
    )
    .option(
      `-k,--api-key <key>`,
      `OpenAPI key (default: OPENAI_SECRET_KEY env var)`,
      process.env.OPENAI_SECRET_KEY,
    )
    .option(
      `-m,--max-concurrent <threads>`,
      `Maximum number of GPT calls to make simultaneously.`,
      myParseInt,
      1,
    )
    .option(
      `-f,--full`,
      `Perform a full refresh, even if frontmatter and overview are already present.`,
      false,
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
      }: Options = options
      const paths = program.args.slice(
        program.args.findIndex((v) => v === _path),
      )
      console.log({ profile, options, paths })

      p(`Using profile: ${profile}`)

      const profilePath = join(home, profile)

      const { generate } = factory({
        profilePath,
        promptIfProfileMissing: true,
      })

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
                  `Please write a <50 word paragraph digest of the subject matter. It is for meta tags and opengraph, so it should include full context.`,
                  { dryRun },
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
                section.startsWith('# Overview'),
              )
              const hasOverview = idx >= 0

              const overviewIndex = (() => {
                if (idx >= 0) return idx
                sections.unshift(`# Overview\n\n`)
                return 0
              })()

              if (!hasOverview || full) {
                const introduction = await generate(
                  `Please write a ~200 word multiparagraph digest of the subject matter. Use an instructive voice, don't refer to "i" or "we". Just directives. Don't say "welcome" or anything like that, just dive into the discussion.`,
                )
                if (!dryRun) {
                  sections[overviewIndex] = `# Overview\n\n${introduction}\n\n`

                  // Combine the sections back into a single string
                  const newContent = sections.join('\n')

                  const frontmatter = yaml.stringify(attributes)
                  writeFileSync(
                    path,
                    `---\n${frontmatter}\n---\n\n${newContent}`,
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
          }),
        ),
      )
    })

  program.parse()
})()
