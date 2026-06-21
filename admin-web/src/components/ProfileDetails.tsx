import {
  formatProfileDate,
  formatProfileValue,
  type Profile,
} from '../lib/supabase'

type DetailItem = {
  label: string
  value: string
  mono?: boolean
}

function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <dl className="detail-grid">
      {items.map(({ label, value, mono }) => (
        <div key={label} className="detail-row">
          <dt>{label}</dt>
          <dd className={mono ? 'mono' : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ProfileDetails({ profile }: { profile: Profile }) {
  return (
    <div className="profile-details">
      <section className="detail-section">
        <h3>Personal</h3>
        <DetailGrid
          items={[
            { label: 'Suffix', value: formatProfileValue(profile.suffix) },
            { label: 'Age', value: formatProfileValue(profile.age) },
            { label: 'Gender', value: formatProfileValue(profile.gender) },
            { label: 'Status', value: formatProfileValue(profile.status) },
            { label: 'Birthdate', value: formatProfileDate(profile.birthdate) },
            { label: 'Nationality', value: formatProfileValue(profile.nationality) },
            { label: 'Place of birth', value: formatProfileValue(profile.place_of_birth) },
            { label: 'Permanent address', value: formatProfileValue(profile.permanent_address) },
          ]}
        />
      </section>

      <section className="detail-section">
        <h3>Contact</h3>
        <DetailGrid
          items={[
            { label: 'Personal email', value: formatProfileValue(profile.personal_email) },
            { label: 'Phone', value: formatProfileValue(profile.phone_number) },
            {
              label: 'Emergency contact',
              value: formatProfileValue(profile.emergency_contact_name),
            },
            {
              label: 'Emergency number',
              value: formatProfileValue(profile.emergency_contact_number),
            },
          ]}
        />
      </section>

      <section className="detail-section">
        <h3>Account & links</h3>
        <DetailGrid
          items={[
            { label: 'Profile ID', value: formatProfileValue(profile.id), mono: true },
            { label: 'Role ID', value: formatProfileValue(profile.role_id) },
            { label: 'Role name', value: formatProfileValue(profile.roles?.name) },
            { label: 'Auth user ID', value: formatProfileValue(profile.auth_user_id), mono: true },
            { label: 'Course ID', value: formatProfileValue(profile.course_id) },
            { label: 'Created', value: formatProfileDate(profile.created_at) },
            { label: 'Updated', value: formatProfileDate(profile.updated_at) },
          ]}
        />
      </section>
    </div>
  )
}
