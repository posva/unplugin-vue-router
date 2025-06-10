import type { Code } from '@vue/language-core'

/**
 * Augments the VLS context (volar) with additianal type information.
 *
 * @param content - content retrieved from the volar pluign
 * @param  getCodes - function that computes the code to add to the VLS context.
 */
export function augmentVlsCtx(content: Code[], getCodes: () => ` & ${string}`) {
  let from = -1
  let to = -1

  for (let i = 0; i < content.length; i++) {
    const code = content[i]

    if (typeof code !== 'string') {
      continue
    }

    if (from === -1 && code.startsWith(`const __VLS_ctx`)) {
      from = i
    } else if (from !== -1 && code === `;\n`) {
      to = i
      break
    }
  }

  if (to === -1) {
    return
  }

  content.splice(to, 0, ...getCodes())
}
