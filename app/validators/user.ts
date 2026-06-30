import vine from '@vinejs/vine'

/**
 * Self-signup validation. The @gnar.dog domain restriction and email
 * uniqueness are enforced in NewAccountController, where they get custom
 * messages and a database lookup.
 */
export const signupValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(1).maxLength(100),
    email: vine.string().trim().email().maxLength(254),
    password: vine
      .string()
      .minLength(8)
      .maxLength(72)
      .confirmed({ confirmationField: 'passwordConfirmation' }),
  })
)
