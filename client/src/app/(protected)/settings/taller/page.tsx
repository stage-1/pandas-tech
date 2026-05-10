import { redirect } from 'next/navigation'

/** @deprecated Taller settings live inline on /settings */
export default function SettingsTallerRedirectPage() {
  redirect('/settings')
}
