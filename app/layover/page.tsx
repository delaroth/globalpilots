import { redirect } from 'next/navigation'

export default function LayoverPage() {
  redirect('/search?tab=stopovers')
}
