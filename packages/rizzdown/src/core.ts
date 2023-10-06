import Bottleneck from 'bottleneck'
import chalk from 'chalk'
import { prompt } from 'enquirer'
import { backOff } from 'exponential-backoff'
import { findUpSync } from 'find-up'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { homedir } from 'os'
import { join } from 'path'

export type RizzGeneratorOptions = {
  dryRun: boolean
  subjectMatter: string
}

export enum Context {
  Style = 'style',
  Author = 'author',
  Subject = 'subject',
  Audience = 'audience',
}

export const OPENAI_SECRET_KEY_NAME = 'openai-secret-key'

export type RizzdownFactoryConfig = {
  profilePath: string
  promptIfProfileMissing: boolean
  maxConcurrent: number
  subjectMatter: string
}

export const RIZZ_HOME_DEFAULT = join(homedir(), `.rizzdown`)
export const RIZZ_HOME = process.env.RIZZDOWN_HOME || RIZZ_HOME_DEFAULT
export const RIZZ_PROFILE_DEFAULT = 'default'

export type RizzProfile = {
  [_ in Context]: string
}

export const p = console.log

const DEFAULT_PROFILE_PROMPTS = {
  [Context.Style]: {
    title: `Please describe the style, tone, and platform of your writing.`,
    example: `I'm writing a serious blog about North American flowers. I travel around and take pictures and post them along with scientific facts. The tone of the blog is scientific and exact. Very detailed and deep.`,
  },
  [Context.Author]: {
    title: `Please provide an author bio. Personality, background, interests, etc.`,
    example: `I am a flower expert and I'm very serious about it. I don't joke around. I have a PHD in botany and am a guest lecutrer at Stanford.`,
  },
  [Context.Subject]: {
    title: `Please give some background information about your subject. Things people would already know that are "common knowledge" in the subject domain. Be brief but detailed.`,
    example: `North America boasts a diverse range of native flowers, adapted to its varying climates and terrains. The sunflower, native to the continent, is not only admired for its beauty but also harvested for its seeds. The columbine, with its unique spurred petals, is commonly found in woodlands and higher altitudes. Dogwoods, producing beautiful white or pink bracts, are popular ornamental trees. The California poppy, with its bright orange blooms, is California's state flower. Goldenrods are often mistakenly blamed for hay fever, but it's actually ragweed causing those symptoms. The bluebonnet, a lupine, paints Texan roadsides blue every spring. The trillium, found in eastern woodlands, is considered a symbol of the American wilderness.`,
  },
  [Context.Audience]: {
    title: `Please describe your ideal audience. Include characteristics about their knowledge, personality, and any other details you might think of.`,
    example: `My audiance is botany hobbiests. They have a lot of knowledge, but they typically don't study or read books. They post a lot on social media when they find a nice flower when going for a hike. They appreciate descriptions about colors, genetics, and especially how to grow their own kind of whatever I am writing about.`,
  },
}

const loadProfile = async (
  profilePath: string,
  promptIfMissing = false,
): Promise<RizzProfile> => {
  const readContext = async (contextType: Context) => {
    const contextPath = join(profilePath, `${contextType}.md`)
    if (existsSync(contextPath)) {
      return readFileSync(contextPath).toString()
    }
    if (!promptIfMissing) throw new Error(`${contextPath} not found.`)
    mkdirSync(profilePath, { recursive: true })
    p(
      chalk.yellow(
        `It looks like you haven't created a ${contextType} definition yet. Let's do it now!`,
      ),
    )
    const { answer } = await prompt<{ answer: string }>({
      type: 'input',
      name: 'answer',
      message: DEFAULT_PROFILE_PROMPTS[contextType].title,
      initial: DEFAULT_PROFILE_PROMPTS[contextType].example,
    })
    writeFileSync(contextPath, answer)
    return answer
  }

  const style = await readContext(Context.Style)

  const author = await readContext(Context.Author)

  const subject = await readContext(Context.Subject)

  const audience = await readContext(Context.Audience)

  return { style, author, audience, subject }
}

function assert<T>(
  v: T | undefined | void | null,
  msg?: string,
): asserts v is T {
  if (!v) {
    throw new Error(msg || `Assertion failure`)
  }
}

const factory = (_config?: Partial<RizzdownFactoryConfig>) => {
  const home = process.env.RIZZDOWN_HOME || RIZZ_HOME_DEFAULT

  const config: RizzdownFactoryConfig = {
    profilePath: join(home, RIZZ_PROFILE_DEFAULT),
    maxConcurrent: 1,
    subjectMatter: '',
    promptIfProfileMissing: false,
    ..._config,
  }

  const { profilePath, maxConcurrent, promptIfProfileMissing } = config

  const _apiKey =
    process.env.OPENAPI_SECRET_KEY ||
    readFileSync(
      findUpSync(OPENAI_SECRET_KEY_NAME, { cwd: profilePath, type: 'file' }) ||
        join(profilePath, OPENAI_SECRET_KEY_NAME),
    )
      .toString()
      .trim()

  const openai = new OpenAI({
    apiKey: _apiKey,
  })

  const limiter = new Bottleneck({ maxConcurrent })

  const generate = async (
    prompt: string,
    _options?: Partial<RizzGeneratorOptions>,
  ) => {
    const options: RizzGeneratorOptions = {
      dryRun: false,
      subjectMatter: config.subjectMatter,
      ..._options,
    }
    const { dryRun, subjectMatter } = options

    assert(subjectMatter, `Subject matter must not be blank`)

    if (dryRun) return `Skipping OpenAI call. Dry run.`

    const { audience, author, style, subject } = await loadProfile(
      profilePath,
      promptIfProfileMissing,
    )

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: `I'm going to ask you to enhance some writing for me. Here is a little about me, the author. Use this information to write in my 'voice':`,
      },
      {
        role: 'user',
        content: author,
      },
      {
        role: 'user',
        content: `Here is some information about my target audience. In formulating your response, use this information to choose wording and mood.`,
      },
      {
        role: 'user',
        content: audience,
      },
      {
        role: 'user',
        content: `Here is some information about the general subject and interest area of my writing. Assume the reader knows most of this, but use it as background information and to reference existing knowledge.`,
      },

      {
        role: 'user',
        content: subject,
      },
      {
        role: 'user',
        content: `Here is some information about the writing style I want to use.`,
      },
      {
        role: 'user',
        content: style,
      },
      {
        role: 'user',
        content: `Finally, here is the subject matter to enhance. This is new information for the reader. Assume they have no prior knowledge if the information provided here is not mentioned in the background information either.`,
      },
      {
        role: 'user',
        content: subjectMatter,
      },
      {
        role: 'user',
        content: `Given all that information, ${prompt}`,
      },
    ]

    const chatCompletion = await limiter.schedule(() =>
      backOff(
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
        },
      ),
    )

    const content = chatCompletion.choices[0].message.content || ''
    return content
  }

  return { generate }
}

export { factory }

export default factory
