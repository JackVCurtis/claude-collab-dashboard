import { Form, Link } from '@adonisjs/inertia/react'

export default function Signup({ allowedDomain }: { allowedDomain: string }) {
  return (
    <div className="form-container">
      <div>
        <h1>Sign up</h1>
        <p>
          Create your account with your <strong>@{allowedDomain}</strong> email address.
        </p>
      </div>

      <div>
        <Form route="new_account.store">
          {({ errors }) => (
            <>
              <div>
                <label htmlFor="fullName">Name</label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  autoComplete="name"
                  data-invalid={errors.fullName ? 'true' : undefined}
                />
                {errors.fullName && <div>{errors.fullName}</div>}
              </div>

              <div>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="username"
                  placeholder={`you@${allowedDomain}`}
                  data-invalid={errors.email ? 'true' : undefined}
                />
                {errors.email && <div>{errors.email}</div>}
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete="new-password"
                  data-invalid={errors.password ? 'true' : undefined}
                />
                {errors.password && <div>{errors.password}</div>}
              </div>

              <div>
                <label htmlFor="passwordConfirmation">Confirm password</label>
                <input
                  type="password"
                  name="passwordConfirmation"
                  id="passwordConfirmation"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <button type="submit" className="button">
                  Create account
                </button>
              </div>
            </>
          )}
        </Form>

        <p>
          Already have an account? <Link route="session.create">Log in</Link>
        </p>
      </div>
    </div>
  )
}
