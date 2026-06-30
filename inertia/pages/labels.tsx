import { Form } from '@adonisjs/inertia/react'
import { type InertiaProps } from '~/types'

type Label = {
  id: string
  key: string
  name: string
  color: string
}

export default function Labels({ labels }: InertiaProps<{ labels: Label[] }>) {
  return (
    <div className="form-container">
      <div>
        <h1>Labels</h1>
        <p>Shared labels your team uses to organize agent work.</p>
      </div>

      <ul>
        {labels.length === 0 ? (
          <li>No labels yet — create the first one below.</li>
        ) : (
          labels.map((label) => (
            <li key={label.id}>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  marginRight: 8,
                  borderRadius: 3,
                  verticalAlign: 'middle',
                  background: label.color,
                }}
              />
              <strong>{label.name}</strong> <code>{label.key}</code>
            </li>
          ))
        )}
      </ul>

      <Form action={{ url: '/labels', method: 'post' }}>
        {({ errors, processing }) => (
          <>
            <div>
              <label htmlFor="key">Key</label>
              <input
                type="text"
                name="key"
                id="key"
                placeholder="bug-fix"
                data-invalid={errors.key ? 'true' : undefined}
              />
              {errors.key && <div>{errors.key}</div>}
            </div>

            <div>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder="Bug fix"
                data-invalid={errors.name ? 'true' : undefined}
              />
              {errors.name && <div>{errors.name}</div>}
            </div>

            <div>
              <label htmlFor="color">Color</label>
              <input type="color" name="color" id="color" defaultValue="#6b7280" />
            </div>

            <div>
              <button type="submit" className="button" disabled={processing}>
                Create label
              </button>
            </div>
          </>
        )}
      </Form>
    </div>
  )
}
