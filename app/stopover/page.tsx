import { redirect } from 'next/navigation'

export default function StopoverPage() {
  redirect('/search?tab=stopovers')
}
